import { eq } from "drizzle-orm";
import { db } from "../../db/core/index.js";
import { hcpReports, notifications } from "../../db/core/schema.js";
import { systemSettings } from "../../db/admin/settings.schema.js";
import { determineNotificationData, shouldCreateNotification } from "../../utils/common/notification-helper.js";
import { runReportingWorkflow } from "../../utils/common/reporting-workflow.js";

/**
 * Handles the logic for creating a new HCP report.
 */
export async function createHcpReport(input: any) {
  // 1. Insert into Database
  const [row] = await db
    .insert(hcpReports)
    .values({
      referenceId: `REP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      products: input.products ?? [],
      symptoms: input.symptoms ?? [],
      patientDetails: input.patientDetails ?? {},
      reporterDetails: input.reporterDetails ?? {},
      takingOtherMeds: input.takingOtherMeds,
      otherMedications: input.otherMedications ?? [],
      hasRelevantHistory: input.hasRelevantHistory,
      medicalHistory: input.medicalHistory ?? [],
      labTestsPerformed: input.labTestsPerformed,
      labTests: input.labTests ?? [],
      additionalDetails: input.additionalDetails,
      attachments: input.attachments ?? [],
      agreedToTerms: input.agreedToTerms,
      status: input.status ?? "new",
      severity: input.severity || determineNotificationData(input, "HCP", "TEMP").type,
      meddraVersion: (await db.select().from(systemSettings).where(eq(systemSettings.id, 1)))[0]?.clinicalConfig?.meddraVersion || "29.1",
      countryCode: input.countryCode,
      senderTimezoneOffset: input.senderTimezoneOffset,
    })
    .returning();

  // 2. Handle System Notifications
  const notifData = determineNotificationData(input, "HCP", row.referenceId || row.id);
  let [settings] = await db.select().from(systemSettings).where(eq(systemSettings.id, 1));
  
  if (!settings) {
    settings = { id: 1, notificationThresholds: { urgentAlerts: true, alertThreshold: "All Severities", notifyOnApproval: true, emailDigest: false, digestFrequency: "Daily", smsAlerts: false } } as any;
  }
  
  if (shouldCreateNotification(settings, notifData)) {
    await db.insert(notifications).values({
      type: notifData.type === "warning" ? "urgent" : notifData.type, // Boost severity if HCP confirms a warning
      title: notifData.title,
      desc: notifData.desc,
      time: notifData.time,
      date: notifData.date,
      reportId: notifData.reportId,
      classificationReason: notifData.classificationReason,
    });
  }

  // 3. Trigger Shared Submission Workflow (E2B, PDF, Email)
  await runReportingWorkflow({
    reportId: row.id,
    reporterType: "HCP",
    table: hcpReports
  });

  return row;
}

