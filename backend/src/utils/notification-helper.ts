export function determineNotificationData(
  data: any,
  reporterType: string,
  reportId: string
) {
  const severityRank: Record<string, number> = {
    info: 0,
    warning: 1,
    urgent: 2,
  };

  const seriousnessMap: Record<string, string> = {
    "death": "urgent",
    "life-threatening": "urgent",
    "hospitalization": "urgent",
    "disability": "warning",
    "congenital": "warning",
    "medical-intervention": "warning",
    "medically-significant": "warning",
  };

  let highestSeverity = "info";
  let reason = "New report submitted";

  const symptoms = Array.isArray(data?.symptoms) ? data.symptoms : [];

  for (const symptom of symptoms) {
    const seriousness = (symptom?.seriousness || "").toLowerCase().trim();
    const mappedSeverity = seriousnessMap[seriousness];

    if (mappedSeverity && severityRank[mappedSeverity] > severityRank[highestSeverity]) {
      highestSeverity = mappedSeverity;
      reason = seriousness;

      if (mappedSeverity === "urgent") break;
    }
  }

  const titlePrefix =
    highestSeverity === "urgent"
      ? "Critical"
      : highestSeverity === "warning"
      ? "Warning"
      : "New";

  const reporter =
    reporterType?.charAt(0)?.toUpperCase() + reporterType?.slice(1) || "Unknown";

  const products = Array.isArray(data?.products) ? data.products : [];
  const productsStr = products
    .map((p: any) => p?.productName)
    .filter(Boolean)
    .join(", ");

  const productDisplay = productsStr || "Unknown Product";

  const title = `${titlePrefix} ${reporter} Report — ${productDisplay}`;

  const patientName =
    data?.patientDetails?.name ||
    data?.patientDetails?.initials ||
    "A patient";

  let desc = `Report ${reportId} — ${patientName} `;

  if (highestSeverity !== "info") {
    desc += `reported a ${reason} event.`;
  } else {
    desc += `submitted a new report.`;
  }

  if (symptoms.length > 0 && symptoms[0]?.name) {
    desc += ` Symptom: ${symptoms[0].name}.`;
  }

  return {
    type: highestSeverity,
    title,
    desc,
    classificationReason: reason, // ⭐ important for audit
    time: "Just now",
    date: "Today",
    reportId,
  };
}

export function determineUpdateNotification(
  oldRecord: any,
  updates: any,
  reporterType: string,
  reportId: string
) {
  const reporter = reporterType?.charAt(0)?.toUpperCase() + reporterType?.slice(1) || "Unknown";
  
  // 1. Check for Approval
  if (updates.status === "approved" && oldRecord.status !== "approved") {
    return {
      type: "approved",
      title: `${reporter} Report Approved — ${reportId}`,
      desc: `The ${reporterType} report for ${reportId} was approved by \${adminId}.`,
      classificationReason: "Report approved by admin",
      time: "Just now",
      date: "Today",
      reportId
    };
  }

  // 2. Check for Urgent Severity change
  if (updates.severity === "urgent" && oldRecord.severity !== "urgent") {
    return {
      type: "urgent",
      title: `Critical Severity Escalation — ${reportId}`,
      desc: `The ${reporterType} report ${reportId} was escalated to Critical severity by \${adminId}.`,
      classificationReason: "Severity escalated to urgent",
      time: "Just now",
      date: "Today",
      reportId
    };
  }

  // 3. Check for Closure
  if (updates.status === "closed" && oldRecord.status !== "closed") {
    return {
      type: "system",
      title: `${reporter} Report Closed — ${reportId}`,
      desc: `The ${reporterType} report ${reportId} was marked as closed by \${adminId}.`,
      classificationReason: "Report closed",
      time: "Just now",
      date: "Today",
      reportId
    };
  }

  return null;
}

export function shouldCreateNotification(settings: any, notification: { type: string }) {
  const notifs = settings?.notificationThresholds || {
    urgentAlerts: true,
    alertThreshold: "All Severities",
    notifyOnApproval: true,
  };

  const type = notification.type;

  // 1. System and Approved notifications ALWAYS bypass severity filters
  // (Approved still respects its own 'notifyOnApproval' toggle later)
  if (type === "system") {
    return true;
  }

  // 2. Handle Urgent Case Alerts toggle
  if (notifs.urgentAlerts === false && type === "urgent") {
    return false;
  }

  // 3. Handle Notify on Approval toggle
  if (notifs.notifyOnApproval === false && type === "approved") {
    return false;
  }

  // Approved type bypasses the rank-based "Threshold" check below
  if (type === "approved") {
    return true;
  }

  // 4. Handle Alert Threshold (Only for urgent, warning, info)
  const rank: Record<string, number> = {
    "info": 0,
    "warning": 1,
    "urgent": 2
  };

  const threshold = notifs.alertThreshold || "All Severities";
  
  if (threshold === "Critical & High") {
    return rank[type] >= 1;
  }
  
  if (threshold === "Critical Only") {
    return rank[type] >= 2;
  }

  return true;
}
