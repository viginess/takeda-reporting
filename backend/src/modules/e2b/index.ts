import { generateE2BR3 } from './generator.js';
import { validateE2BR3 } from './validator.js';
import { storeE2BR3 } from './storage.js';
import { patientReports, hcpReports, familyReports } from '../../db/schema.js';
import { systemSettings } from '../../db/admin/settings.schema.js';
import { db } from '../../db/index.js';
import { eq } from 'drizzle-orm';
/**
 * Main orchestrator for the E2B XML workflow.
 * Generates, validates, stores, and updates the report record.
 */
export async function processE2BWorkflow(reportId: string) {
  try {
    console.log(`Starting E2B Workflow for report: ${reportId}`);

    // 1. Fetch the report from DB, checking all 3 tables
    let report: any = null;
    let tableToUpdate: any = null;

    const [pReport] = await db.select().from(patientReports).where(eq(patientReports.id, reportId));
    if (pReport) {
      report = pReport;
      tableToUpdate = patientReports;
    } else {
      const [hReport] = await db.select().from(hcpReports).where(eq(hcpReports.id, reportId));
      if (hReport) {
        report = hReport;
        tableToUpdate = hcpReports;
      } else {
        const [fReport] = await db.select().from(familyReports).where(eq(familyReports.id, reportId));
        if (fReport) {
          report = fReport;
          tableToUpdate = familyReports;
        }
      }
    }

    if (!report || !tableToUpdate) {
      throw new Error(`Report not found in any form table: ${reportId}`);
    }

    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    const senderId = settings?.clinicalConfig?.senderId || 'CLINSOLUTION-DEFAULT';
    const receiverId = settings?.clinicalConfig?.receiverId || 'EVHUMAN';

    // 2. Generate XML
    const xml = generateE2BR3(report, { senderId, receiverId });
    console.log('XML Generated');

    // 3. Validate XML
    const validation = await validateE2BR3(xml);
    if (!validation.valid) {
      console.warn('E2B XML Validation failed:', validation.errors);
    } else {
      console.log('E2B XML Validation passed');
    }

    // 4. Store XML in Supabase (returns the filePath)
    const xmlPath = await storeE2BR3(report.referenceId || reportId, xml);
    console.log(`XML Stored at path: ${xmlPath}`);

    // 5. Update Report with XML Path
    await db
      .update(tableToUpdate)
      .set({
        xmlUrl: xmlPath,
        updatedAt: new Date(),
      })
      .where(eq(tableToUpdate.id, reportId));

    return {
      success: true,
      xmlPath,
      isValid: validation.valid,
      errors: validation.errors,
    };
  } catch (error: any) {
    console.error('E2B Workflow Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
