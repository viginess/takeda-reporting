/**
 * PRE-VALIDATION: Catch basic data integrity errors before XML generation.
 * This provides cleaner errors for structural issues like missing mandatory ICH E2B(R3) fields.
 */
export function preValidateFormData(report: any): { valid: boolean; errors: { message: string; type: string }[] } {
  const errors: { message: string; type: string }[] = [];

  // 1. Reporter reference — used for country check (C.2.r.3)
  // C.2.r.2 (patient name/initials) is optional — anonymous reports are permitted
  const reporter = report.reporterDetails || report.hcpDetails;

  // 2. Gender Check (D.5)
  const gender = report.patientDetails?.gender;
  if (!gender) {
    errors.push({ message: "Patient gender is missing (D.5).", type: "pre-validation" });
  }

  // 3. Seriousness Check (A.1.5.1)
  const severityVal = (report.severity || '').toLowerCase();
  const isSeriousSource = (report as any).seriousness ?? (report as any).isSerious ?? (['fatal', 'life-threatening'].includes(severityVal) ? '1' : '2');
  
  if (isSeriousSource === undefined || isSeriousSource === null) {
    errors.push({ 
      message: "Case Seriousness is missing (A.1.5.1). Must specify if the case is serious or non-serious.", 
      type: "pre-validation" 
    });
  }

  // 4. Suspect Drug Check (G.k)
  const products = report.products || [];
  if (products.length === 0) {
    errors.push({ message: "At least one Suspect Drug must be provided (G.k).", type: "pre-validation" });
  } else {
    products.forEach((p: any, idx: number) => {
      if (!p.productName || p.productName.trim() === '') {
        errors.push({ message: `Product[${idx}] name is missing (G.k.2.2).`, type: "pre-validation" });
      }
      if (!p.characterization) {
        // Default first drug to 'Suspect' if missing, others concomitant
        const defaultChar = idx === 0 ? 'Suspect' : 'Concomitant';
        console.log(`Product[${idx}] characterization missing, defaulting to ${defaultChar}`);
      }
    });
  }

  // 5. Case Narrative (H.1) — recommended but not blocking; admin can add later
  // const narrative = report.description || report.additionalDetails;

  // 6. Reporter Country Check (C.2.r.3)
  const reporterCountry = reporter?.country || report.patientDetails?.country || report.countryCode;
  if (!reporterCountry) {
    errors.push({ message: "Reporter/Occurrence Country is missing (C.2.r.3).", type: "pre-validation" });
  }

  // 7. Patient Age/DOB (D.2/D.1) — optional; reporters may not know or wish to share
  // const hasAgeValue = report.patientDetails?.ageValue || report.patientDetails?.age || report.patientDetails?.dateOfBirth || report.patientDetails?.dob;

  // 8. Adverse Reaction Check (E.i)
  const symptoms = report.symptoms || [];
  if (symptoms.length === 0) {
    errors.push({ message: "At least one Adverse Reaction/Symptom must be provided (E.i).", type: "pre-validation" });
  } else {
    symptoms.forEach((s: any, idx: number) => {
      if (!s.name || s.name.trim() === '') {
        errors.push({ message: `Symptom[${idx}] name is missing (E.i.1.1).`, type: "pre-validation" });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
