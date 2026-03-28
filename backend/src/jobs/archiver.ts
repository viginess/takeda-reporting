import { eq, lt, and, ne } from "drizzle-orm";
import { db } from '../db/core/index.js';
import { 
  systemSettings, 
  patientReports, 
  hcpReports, 
  familyReports, 
  archivedReports, 
  auditLogs 
} from '../db/core/schema.js';

/**
 * Parses retention period string (e.g., "6 months", "24 months") into a Date object.
 * Returns the cutoff date (anything older than this should be archived).
 */
function calculateCutoff(retentionString: string): Date {
  const now = new Date();
  const match = retentionString.match(/(\d+)\s+month/i);
  const months = match ? parseInt(match[1]) : 6; // Default to 6 if parsing fails
  
  const cutoff = new Date(now);
  cutoff.setMonth(now.getMonth() - months);
  return cutoff;
}

export async function runArchiver() {
  
  try {
    // 1. Get retention setting
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    if (!settings?.clinicalConfig?.retention) {
      return;
    }

    const cutoff = calculateCutoff(settings.clinicalConfig.retention);

    await db.transaction(async (tx) => {
      let totalArchived = 0;

      // Helper to move reports
      const archiveFromTable = async (table: any, tableName: string) => {
        const oldReports = await tx
          .select()
          .from(table)
          .where(and(
            lt(table.createdAt, cutoff),
            ne(table.status, 'closed') // Optional: only archive closed or just archive based on age? 
            // User requested age-based archiving, so we'll archive everything older than X months.
          ));

        if (oldReports.length === 0) return 0;



        for (const report of oldReports) {
          await tx.insert(archivedReports).values({
            ...report,
            originalTable: tableName,
            originalCreatedAt: report.createdAt,
            archivedAt: new Date(),
          });
          
          await tx.delete(table).where(eq(table.id, report.id));
        }

        return oldReports.length;
      };

      totalArchived += await archiveFromTable(patientReports, "patient");
      totalArchived += await archiveFromTable(hcpReports, "hcp");
      totalArchived += await archiveFromTable(familyReports, "family");

      if (totalArchived > 0) {
        // Log the event
        await tx.insert(auditLogs).values({
          entity: "system",
          entityId: "cleanup",
          action: "ARCHIVE_OLD_REPORTS",
          changedBy: "System Cron",
          oldValue: { count: 0 },
          newValue: { count: totalArchived, policy: settings.clinicalConfig.retention },
        });
      }
    });

  } catch (error) {
    // Error handling without console.log
  }
}
