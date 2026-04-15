import { generateE2BR3 } from './core/generator.js';
import { validateE2BR3 } from './validation/validator.js';
import { storeE2BR3 } from './core/storage.js';
import { patientReports, hcpReports, familyReports } from '../../db/core/schema.js';
import { systemSettings } from '../../db/admin/settings.schema.js';
import { db } from '../../db/core/index.js';
import { eq } from 'drizzle-orm';
import { auditLogs } from '../../db/core/schema.js';
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
    let reportType: 'Patient' | 'HCP' | 'Family' = 'Patient';

    const [pReport] = await db.select().from(patientReports).where(eq(patientReports.id, reportId));
    if (pReport) {
      report = pReport;
      tableToUpdate = patientReports;
    } else {
      const [hReport] = await db.select().from(hcpReports).where(eq(hcpReports.id, reportId));
      if (hReport) {
        report = hReport;
        tableToUpdate = hcpReports;
        reportType = 'HCP';
      } else {
        const [fReport] = await db.select().from(familyReports).where(eq(familyReports.id, reportId));
        if (fReport) {
          report = fReport;
          tableToUpdate = familyReports;
          reportType = 'Family';
        }
      }
    }

    if (!report || !tableToUpdate) {
      throw new Error(`Report not found in any form table: ${reportId}`);
    }

    const [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
    const senderId = settings?.clinicalConfig?.senderId || 'CLINSOLUTION-DEFAULT';
    const receiverId = settings?.clinicalConfig?.receiverId || 'EVHUMAN';
    const reportCountry = report.countryCode || (settings?.clinicalConfig as any)?.countryCode || 'US';

    // 1.5. Manage Safety Report ID and Version
    let safetyReportId = report.safetyReportId;
    let reportVersion = report.reportVersion || 1;

    if (!safetyReportId) {
      // Generate initial Safety Report ID: COUNTRY-SENDER-ID
      safetyReportId = `${reportCountry}-${senderId}-${(report.referenceId || report.id.substring(0, 8)).toUpperCase()}`;
      
      // Persist it immediately so it's locked for follow-ups
      await db.update(tableToUpdate)
        .set({ safetyReportId, reportVersion: 1 })
        .where(eq(tableToUpdate.id, reportId));
    } else {
      // If it exists, we might be re-exporting. 
      // In a real system, you'd increment version only on "submission", 
      // but for this implementation we'll assume a new workflow run implies a version increment if already exists.
      // However, usually v1 stay v1 until actually "sent".
      // Let's just use what's in the DB for now.
    }

    // Refresh report object with new IDs
    report.safetyReportId = safetyReportId;
    report.reportVersion = reportVersion;

    // 2. Data Enrichment (Fetch WHODrug ingredients if needed)
    const { whodrugService } = await import('../whodrug/whodrug.service.js');
    const allProducts = [...(report.products || []), ...(report.otherMedications || [])];
    const whoCodes = allProducts.map((p: any) => p.whodrugCode).filter(Boolean);
    
    if (whoCodes.length > 0) {
      const ingredientMapping = await whodrugService.getIngredientsForDrugs(whoCodes);
      // Enrich report products with their dictionary ingredients
      if (report.products) {
        report.products = report.products.map((p: any) => ({
          ...p,
          ingredients: p.whodrugCode ? ingredientMapping[p.whodrugCode] : undefined
        }));
      }
      if (report.otherMedications) {
        report.otherMedications = report.otherMedications.map((p: any) => ({
          ...p,
          ingredients: p.whodrugCode ? ingredientMapping[p.whodrugCode] : undefined
        }));
      }
    }

    // 3. Generate XML
    const sysSettings = (await db.select().from(systemSettings).where(eq(systemSettings.id, 1)).limit(1))[0];
    const meddraVersion = sysSettings?.clinicalConfig?.meddraVersion || "29.0";
    
    // 4. Validation Flow (Tier 1 & Tier 2)
    const { preValidateFormData } = await import('./validation/pre-validator.js');
    const preValidation = preValidateFormData(report);
    
    const xml = generateE2BR3(report, { senderId, receiverId, reportType, meddraVersion });
    console.log('XML Generated');

    const schemaValidation = await validateE2BR3(xml);
    
    const finalValid = preValidation.valid && schemaValidation.valid;
    const finalErrors = [...preValidation.errors, ...schemaValidation.errors];

    if (!finalValid) {
      console.warn('E2B Validation failed:', finalErrors);
    } else {
      console.log('E2B Validation passed');
    }

    // 4. Store XML in Supabase (returns the filePath)
    const xmlPath = await storeE2BR3(report.referenceId || reportId, xml);
    console.log(`XML Stored at path: ${xmlPath}`);

    // 5. Update Report with XML Path and Validation Status
    await db
      .update(tableToUpdate)
      .set({
        xmlUrl: xmlPath,
        isValid: finalValid,
        validationErrors: finalErrors,
        updatedAt: new Date(),
      } as any)
      .where(eq(tableToUpdate.id, reportId));

    // 6. Audit Logging
    try {
      await db.insert(auditLogs).values({
        entity: 'report_export',
        entityId: report.safetyReportId || reportId,
        reportId: reportId,
        changedBy: 'SYSTEM', // Context-aware user would be better
        action: 'XML_EXPORT',
        newValue: { xmlPath, isValid: finalValid, version: reportVersion }
      });
    } catch (auditError) {
      console.error('Audit Log failed:', auditError);
      // Don't fail the whole workflow if audit log fails
    }

    return {
      success: true,
      xmlPath,
      xmlContent: xml,
      isValid: finalValid,
      errors: finalErrors,
      enrichedReport: report
    };
  } catch (error: any) {
    console.error('E2B Workflow Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
