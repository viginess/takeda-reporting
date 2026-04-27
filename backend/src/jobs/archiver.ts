import { eq, lt, and } from "drizzle-orm";
import { db } from '../db/core/index.js';
import { 
  systemSettings, 
  patientReports, 
  hcpReports, 
  familyReports, 
  archivedReports, 
  auditLogs 
} from '../db/core/schema.js';
import { uploadReportToArchive } from "./archive-storage.js";

/**
 * Parses retention period string (e.g., "6 months", "24 months") into a Date object.
 */
function calculateCutoff(retentionString: string): Date {
  const now = new Date();
  const match = retentionString.match(/(\d+)\s+month/i);
  const months = match ? parseInt(match[1]) : 6;
  
  const cutoff = new Date(now);
  cutoff.setMonth(now.getMonth() - months);
  return cutoff;
}

export async function runArchiver(force: boolean = false): Promise<number> {
  console.log(`[Archiver] Starting job. Force mode: ${force}`);
  
  try {
    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    const retentionSetting = settings?.clinicalConfig?.retention || "24 months";
    const cutoff = calculateCutoff(retentionSetting);

    const result = await db.transaction(async (tx) => {
      let totalArchived = 0;

      const archiveFromTable = async (table: any, reporterType: string) => {
        const condition = force 
          ? eq(table.status, 'closed')
          : and(lt(table.createdAt, cutoff), eq(table.status, 'closed'));

        const targetReports = await tx
          .select()
          .from(table)
          .where(condition);

        if (targetReports.length === 0) return 0;

        for (const report of targetReports) {
          const referenceId = report.referenceId || report.id;
          const storagePath = await uploadReportToArchive(referenceId, report);

          await tx.insert(archivedReports).values({
            referenceId: referenceId,
            reporterType: reporterType,
            storagePath: storagePath,
            archivedAt: new Date(),
          });
          
          await tx.delete(table).where(eq(table.id, report.id));
        }

        return targetReports.length;
      };

      totalArchived += await archiveFromTable(patientReports, "Patient");
      totalArchived += await archiveFromTable(hcpReports, "HCP");
      totalArchived += await archiveFromTable(familyReports, "Family");

      if (totalArchived > 0) {
        await tx.insert(auditLogs).values({
          entity: "system",
          entityId: "cleanup",
          action: "ARCHIVE_OLD_REPORTS",
          changedBy: force ? "Admin (Manual Force)" : "System Cron",
          oldValue: { count: 0 },
          newValue: { count: totalArchived, force },
        });
        console.log(`[Archiver] Successfully archived ${totalArchived} reports.`);
      } else {
        console.log(`[Archiver] No reports matched the cleanup criteria.`);
      }

      return totalArchived;
    });

    return result;

  } catch (error: any) {
    console.error("[Archiver Error]:", error.message || error);
    throw error;
  }
}
