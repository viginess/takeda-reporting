import {
  FileText, AlertTriangle, Clock, CheckCircle, Check
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Status = "Submitted" | "In Review" | "Approved" | "Closed" | "Urgent";
export type Severity = "Critical" | "High" | "Medium" | "Low";
export type ReporterType = "Patient" | "HCP" | "Family";

export interface AuditEntry {
  action: string;
  by: string;
  at: string;
  field?: string;
  from?: string;
  to?: string;
}

export interface Report {
  id: string;
  originalId?: string;
  drug: string;
  batch: string;
  reporter: string;
  reporterType: ReporterType;
  status: Status;
  severity: Severity;
  submitted: string;
  description: string;
  adminNotes?: string | null;
  audit: AuditEntry[];
  fullDetails?: any;
  isValid?: boolean;
  validationErrors?: any[];
}

export interface MedDRATerm {
  term?: string;
  code?: string | null;
  description?: string;
  type?: string;
  socCode?: string;
  socName?: string;
  ptCode?: string;
  ptName?: string;
  lltCode?: string;
  lltName?: string;
}

// ── Style Config ──────────────────────────────────────────────────────────────
export const statusCfg: Record<Status, { bg: string; text: string; border: string; icon: any }> = {
  Urgent:    { bg: "red.50", text: "#1e293b", border: "red.200", icon: AlertTriangle },
  "In Review": { bg: "yellow.50", text: "orange.500", border: "yellow.200", icon: Clock },
  Submitted: { bg: "blue.50", text: "blue.600", border: "blue.200", icon: FileText },
  Approved:  { bg: "green.50", text: "emerald.600", border: "green.200", icon: CheckCircle },
  Closed:    { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0", icon: Check },
};

export const severityCfg: Record<Severity, { color: string; bg: string }> = {
  Critical: { color: "#CE0037", bg: "red.50" },
  High:     { color: "orange.500", bg: "orange.50" },
  Medium:   { color: "orange.500", bg: "yellow.50" },
  Low:      { color: "emerald.600", bg: "green.50" },
};

export const reporterTypeCfg: Record<ReporterType, { color: string; bg: string }> = {
  Patient: { color: "#CE0037", bg: "red.50" },
  HCP:     { color: "purple.600", bg: "purple.50" },
  Family:  { color: "cyan.700", bg: "cyan.50" },
};

export const statusOptions: Status[] = ["Submitted", "In Review", "Approved", "Closed", "Urgent"];
export const severityOptions: Severity[] = ["Critical", "High", "Medium", "Low"];
