
/**
 * Maps raw database report rows into a clean, typed object for the Admin UI.
 * This handles complex transformations including audit log formatting, 
 * severity translation, and detail extraction from JSON fields.
 */
export function mapReportRecord(row: any, audits: any[] = []) {
  const patient = row.patientDetails || {};
  const symptomsArr = Array.isArray(row.symptoms)
    ? row.symptoms
    : row.symptoms
      ? [row.symptoms]
      : [];
  const primarySymptom = symptomsArr[0] || {};
  const products = row.products || [];
  const primaryProduct = products[0] || {};

  const reportAudits = audits
    .filter((a) => a.entity === "report" && String(a.entityId) === String(row.id))
    .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
    .map((a) => {
      let field: string | undefined;
      let from: string | undefined;
      let to: string | undefined;

      const oldVal = a.oldValue;
      const newVal = a.newValue;

      if (
        oldVal &&
        typeof oldVal === "object" &&
        !Array.isArray(oldVal)
      ) {
        const keys = Object.keys(oldVal);
        if (keys.length === 1) {
          field = keys[0];
          const key = field;
          from =
            oldVal[key] === null || oldVal[key] === undefined
              ? "None"
              : String(oldVal[key]);

          if (
            newVal &&
            typeof newVal === "object" &&
            !Array.isArray(newVal)
          ) {
            const nv = (newVal as any)[key];
            to =
              nv === null || nv === undefined ? "None" : String(nv);
          }
        }
      }

      // Fallback to raw JSON if we couldn't infer a single field
      if (!field) {
        from = oldVal ? JSON.stringify(oldVal) : undefined;
        to = newVal ? JSON.stringify(newVal) : undefined;
      }

      return {
        action: a.action,
        by: a.changedBy,
        at: new Date(a.changedAt).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          month: "short",
          day: "numeric",
        }),
        field,
        from,
        to,
      };
    });

  const reporter = row.reporterDetails || row.hcpDetails || {};
  const reporterFullName = [reporter.firstName, reporter.lastName]
    .filter(Boolean)
    .join(" ");

  const reporterName =
    reporterFullName || patient.name || patient.initials || "Anonymous";

  return {
    id: row.referenceId || row.id,
    originalId: row.id,
    drug: primaryProduct.productName || "Unknown",
    batch: primaryProduct.batches?.[0]?.batchNumber || "Unknown",
    reporter: reporterName,
    reporterType: row.reporterType,
    status:
      row.severity === "urgent" &&
      row.status !== "closed" &&
      row.status !== "approved"
        ? "Urgent"
        : row.status === "new"
          ? "Submitted"
          : row.status === "under_review"
            ? "In Review"
            : row.status === "approved"
              ? "Approved"
              : "Closed",
    severity:
      row.severity === "urgent"
        ? "Critical"
        : row.severity === "warning"
          ? "High"
          : "Low",
    submitted: new Date(row.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    adminNotes: row.adminNotes || null,
    description:
      row.adminNotes ||
      row.additionalDetails ||
      (primarySymptom.name
        ? `Symptom: ${primarySymptom.name}`
        : "No details provided."),
    outcome:
      primarySymptom.outcome && primarySymptom.outcome !== ""
        ? primarySymptom.outcome
        : "Not Provided",
    audit: reportAudits,
    isValid: row.isValid !== false,
    validationErrors: row.validationErrors || [],
    fullDetails: {
      patientDetails: row.patientDetails || null,
      hcpDetails: row.hcpDetails || null,
      reporterDetails: row.reporterDetails || null,
      symptoms: row.symptoms || null,
      products: row.products || null,
      medicalHistory: {
        hasHistory: row.hasRelevantHistory || null,
        details: row.medicalHistory || null,
      },
      medications: {
        takingOtherMeds: row.takingOtherMeds || null,
        details: row.otherMedications || null,
      },
      labTests: {
        performed: row.labTestsPerformed || null,
        details: row.labTests || null,
      },
      attachments: row.attachments || null,
      additionalDetails: row.additionalDetails || null,
      xmlUrl: row.xmlUrl || null,
      pdfUrl: row.pdfUrl || null,
    },
  };
}
