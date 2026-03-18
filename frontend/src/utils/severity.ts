/**
 * Calculates the overall report severity based on the most severe symptom seriousness.
 * Standard E2B(R3) triage logic for safety reporting.
 */
export function calculateSeverity(symptoms: any[] = []): string {
  const allSeriousness = symptoms.flatMap((s: any) => 
    Array.isArray(s.seriousness) ? s.seriousness : [s.seriousness].filter(Boolean)
  );
  
  const serStr = allSeriousness.join(',').toLowerCase();
  
  if (serStr.includes("death") || serStr.includes("fatal")) return "fatal";
  if (serStr.includes("life")) return "life-threatening";
  if (serStr.includes("hosp")) return "hospitalization";
  if (serStr.includes("disabl")) return "disabling";
  if (allSeriousness.length > 0) return "serious";
  
  return "info";
}
