import {
  FileText, AlertTriangle, Clock, CheckCircle, Check
} from "lucide-react";

// ── Shared Domain Types ─────────────────────────────────────────────────────────

/**
 * Represents the current lifecycle state of an adverse event report.
 */
export type Status = "Submitted" | "In Review" | "Approved" | "Closed" | "Urgent";

/**
 * Standardized categorization of incident severity to dictate triage priority.
 */
export type Severity = "Critical" | "High" | "Medium" | "Low";

/**
 * Classification of the person who originally submitted the adverse event data.
 * HCP = Health Care Professional.
 */
export type ReporterType = "Patient" | "HCP" | "Family";

/**
 * Represents a single chronological log entry in a Report's history.
 * Used for compliance and tracking exactly who changed what, and when.
 */
export interface AuditEntry {
  action: string;      // e.g. "Status changed", "Note added"
  by: string;          // Name or ID of the user who performed the action
  at: string;          // ISO timestamp of when it happened
  field?: string;      // The specific field that was modified (optional)
  from?: string;       // The previous value (optional)
  to?: string;         // The new value (optional)
}

/**
 * Primary interface for an Adverse Event or Medical Incident Report.
 * Maps tightly to the database schema for the frontend dashboard.
 */
export interface Report {
  id: string;                      // Unique database UUID for the report
  originalId?: string;             // Reference ID if imported from an external system
  drug: string;                    // The specific product/drug name involved
  batch: string;                   // Manufacturing batch/lot number
  reporter: string;                // Name of the reporting individual
  reporterType: ReporterType;      // Classification of the reporter
  status: Status;                  // Current progression stage in the system
  severity: Severity;              // Urgency grouping 
  submitted: string;               // ISO Timestamp of original submission
  description: string;             // Detailed medical narrative of the event
  adminNotes?: string | null;      // Internal private notes appended by staff
  audit: AuditEntry[];             // Historical trail of modifications
  fullDetails?: any;               // Flexible JSON container for extended form data
  isValid?: boolean;               // System validation flag
  validationErrors?: any[];        // Contains failed validation constraints, if any
}

/**
 * Standardized medical vocabulary mapping object used when translating
 * user descriptions into formalized medical coding standard entries.
 */
export interface MedDRATerm {
  term?: string;                   // The literal term matched
  code?: string | null;            // Official numerical code associated with the term
  description?: string;            // Extended clinical definition
  type?: string;                   // Classification level (e.g. LLT, PT, SOC)
  socCode?: string;                // System Organ Class Code mapping
  socName?: string;                // System Organ Class Human-readable Name
  ptCode?: string;                 // Preferred Term Code mapping
  ptName?: string;                 // Preferred Term Name
  lltCode?: string;                // Lowest Level Term Code mapping
  lltName?: string;                // Lowest Level Term Name
}

// ── UI Data & Styling Definitions ─────────────────────────────────────────────
// These configuration dictionaries map the domain types (Status, Severity, etc)
// to hardcoded visual themes and icons, ensuring UI consistency across the app.

export const statusCfg: Record<Status, { bg: string; text: string; border: string; icon: any }> = {
  Urgent:      { bg: "red.50",    text: "#1e293b",   border: "red.200",    icon: AlertTriangle },
  "In Review": { bg: "yellow.50", text: "orange.500", border: "yellow.200", icon: Clock },
  Submitted:   { bg: "blue.50",   text: "blue.600",   border: "blue.200",   icon: FileText },
  Approved:    { bg: "green.50",  text: "emerald.600", border: "green.200",  icon: CheckCircle },
  Closed:      { bg: "#f8fafc",   text: "#64748b",   border: "#e2e8f0",    icon: Check },
};

export const severityCfg: Record<Severity, { color: string; bg: string }> = {
  Critical: { color: "#CE0037",    bg: "red.50" },
  High:     { color: "orange.500", bg: "orange.50" },
  Medium:   { color: "orange.500", bg: "yellow.50" },
  Low:      { color: "emerald.600", bg: "green.50" },
};

export const reporterTypeCfg: Record<ReporterType, { color: string; bg: string }> = {
  Patient: { color: "#CE0037",     bg: "red.50" },
  HCP:     { color: "purple.600",  bg: "purple.50" },
  Family:  { color: "cyan.700",    bg: "cyan.50" },
};

// Expose enum arrays for use in UI dropdowns and select fields
export const statusOptions: Status[] = ["Submitted", "In Review", "Approved", "Closed", "Urgent"];
export const severityOptions: Severity[] = ["Critical", "High", "Medium", "Low"];
