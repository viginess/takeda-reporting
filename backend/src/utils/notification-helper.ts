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
