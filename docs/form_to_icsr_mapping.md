# 🗺️ Master Form Field to ICSR E2B(R3) Dictionary (Verified & Audited)

This document is the **Gold Standard** mapping for the Clin Solutions Safety Reporting system. 
> [!IMPORTANT]
> **Audit Status:** COMPLETED (March 18, 2026).
> **Synchronization:** 100% (No dropped fields). All frontend Zod keys are now verified to flow into both PDF and XML outputs.

---

## 1. System Envelopes & Triage (Generated Automatically)
These fields are sent invisibly or computed dynamically by the backend.

| Frontend JSON Payload | E2B XML Path | E2B Element ID | Value Mapping Details |
| :--- | :--- | :--- | :--- |
| `countryCode` | `id` | **N.2.r.1 / C.1.1** | Used to prefix the worldwide Message ID (e.g., `US-CLIN-2026`). |
| `status` | `observation/value` | **C.1.11.1** | Distinguishes Initial (Empty), Amendment (1), or Nullification (2). |
| `severity` | `observationEvent/value` | **C.1.7** | Converted to Boolean: `true` if "Fatal" or "Life-Threatening" (Expedited Report). |
| `submissionLanguage` | `narrative/value` | **H.5.r** | Defines the native ISO language tag used in the Native Narrative section. |
| `reporterType` | `header/reporttype` | **C.1.3** | Form origin type: `1`=HCP (Spontaneous), `3`=Patient/Family (Other). |
| `reporterType` | `primarysource/qualification` | **C.2.r.4** | `1/2/3`=HCP, `5`=Patient/Family (Consumer). |
| `agreedToTerms` | *N/A (Ignored)* | **N/A** | Used only for internal compliance; stripped out of E2B output for privacy. |

---

## 2. Product Details (Step 1 JSON: `products[]`)
| Form Type(s) | JSON Field | E2B XML Path | E2B Element ID | Value Mapping Details |
| :--- | :--- | :--- | :--- | :--- |
| **All Forms** | `productName` | `consumable/name` | **G.k.2.2** | Full Trade Name or Generic Name of Suspect Drug. |
| **All Forms** | `conditions.name` | `indication/originalText` | **G.k.7.r.2b** | Reason for usage (Indication). Mapped as raw text if no MedDRA code exists. |
| **All Forms** | `batches.batchNumber` | `consumable/lotNumberName`| **G.k.2.3.r.1** | Lot/Batch trace number. |
| **Patient Only**| `actionTaken` | `actionTaken/value` | **G.k.8** | Converted to action code (e.g., dose reduced, withdrawn). |
| **HCP / Family**| `doseForm` | `formCode` | **G.k.4.r.1.1** | IDMP Dosage form code (e.g., tablet, injection). |
| **HCP / Family**| `route` | `routeCode` | **G.k.4.r.10.1** | Administration route string. |
| **All Forms** | `dosage` | `doseQuantity/value & unit` | **G.k.4.r.1a/b** | Splices text to numeric amount and string unit (e.g., 50mg). |

---

## 3. Event / Symptom Details (Step 2 JSON: `symptoms[]`)
| Form Type(s) | JSON Field | E2B XML Path | E2B Element ID | Value Mapping Details |
| :--- | :--- | :--- | :--- | :--- |
| **All Forms** | `name` / `lltName` | `reaction/code/displayName` | **E.i.2.1b** | MedDRA Lowest Level Term (LLT) string. |
| **All Forms** | `meddraCode` / `lltCode`| `reaction/code` | **E.i.2.1a** | 8-digit MedDRA ID mapped via OID `2.16.840.1.113883.6.163`. |
| **All Forms** | `eventStartDate` | `effectiveTime/low` | **E.i.4** | Symptom Start Date formatted to `YYYYMMDDHHMMSS+0000`. |
| **All Forms** | `eventEndDate` | `effectiveTime/high` | **E.i.5** | Symptom Resolution Date. |
| **All Forms** | `seriousness` | `seriousnessCriterion/value`| **E.i.3.2** | Plucked for keywords (Fatal, Hospitalization) per event. |
| **All Forms** | `outcome` | `outboundRelationship/value`| **E.i.7** | Reaction outcome ID: (1=Recovered, 6=Death). |
| **All Forms** | `treatment` | `narrative/text` | **E.i.8** | Typically fused into the narrative or medication history. |
| **HCP Only** | `relationship` | `outboundRelationship` | **G.k.9.i** | Causality Matrix (linking Suspect Drug to Reaction). |

---

## 4. Personal & Reporter Details (Step 3 JSON)
Mapped either from `patientDetails` or `hcpDetails` depending on the reporter.

| Form Type(s) | JSON Field | E2B XML Path | E2B Element ID | Value Mapping Details |
| :--- | :--- | :--- | :--- | :--- |
| **Patient Form**| `patientDetails.name` | `primarysource/given` | **C.2.r.1.2** | Reporter's Given Name (Because Patient is the reporter). |
| **All Forms** | `patientDetails.initials` | `patient/name/given` | **D.1.1.2** | Extracted strict 2-letter Initials for anonymity. |
| **All Forms** | `patientDetails.dob` | `patient/birthTime` | **D.2.1** | Patient Birth Date. |
| **All Forms** | `patientDetails.ageValue` | `patient/age/value` | **D.2.2a** | Integer representing Patient Age at event onset. |
| **All Forms** | `patientDetails.gender` | `patient/genderCode` | **D.5** | Enum map: `M`=1, `F`=2, `O`=3, `Unknown`=9. |
| **HCP Form** | `hcpPatientDetails.weight`| `patient/weight` | **D.3** | Decimal / Integer representing `kg`. |
| **HCP Form** | `hcpPatientDetails.height`| `patient/height` | **D.4** | Decimal / Integer representing `cm`. |
| **HCP / Family**| `reporterDetails.firstName`| `primarysource/given` | **C.2.r.1.2** | The HCP or Family Member filling out the form. |
| **HCP / Family**| `reporterDetails.lastName` | `primarysource/family` | **C.2.r.1.4** | The HCP or Family Member filling out the form. |
| **HCP / Family**| `reporterDetails.country` | `primarysource/country` | **C.2.r.3** | Reporter Country Code (ISO-3166-1). |
| **HCP Only** | `reporterDetails.institution`| `primarysource/organization`| **C.2.r.2.2** | Only healthcare professionals declare an organization. |

---

## 5. Medical Context & Attachments (Step 4 JSON)
| Form Type(s) | JSON Field | E2B XML Path | E2B Element ID | Value Mapping Details |
| :--- | :--- | :--- | :--- | :--- |
| **All Forms** | `medicalHistory.conditionName`| `medicalHistory/disease` | **D.7.1.r.1b** | Pre-existing history name. |
| **All Forms** | `otherMedications.product` | `consumable/name` | **G.k.2.2** | Handled identically to Suspect Drugs but coded as "Concomitant". |
| **All Forms** | `labTests.testName` | `investigation/displayName` | **F.r.2.2b** | Lab Test / Procedure name. |
| **All Forms** | `labTests.testValue` | `investigation/value` | **F.r.3.2** | Numeric result of lab test. |
| **All Forms** | `additionalDetails` | `narrative/text` | **H.5.r** | Preserved exactly as typed in original Native Language. |
| *(Translated)* | `additionalDetails` | `narrative/text` | **H.1** | Base64 embedded or Auto-Translated Global English Narrative. |
| **All Forms** | `attachments` | `reference/document/text` | **C.1.6.1** | Embedded as pure Base64 PDF/Image strings. |
