import { router } from "../../trpc/init.js";
import {
  syncProfile,
  updateAdminProfile,
  syncPasswordChange,
  getAdmins,
  getMe,
  updateAdminRole,
  inviteAdmin,
  toggleTwoFactor,
} from "./profile.router.js";
import {
  getAllReports,
  updateReport,
  getDashboardStats,
  getUrgentReports,
  getStatusDistribution,
  getMonthlyVolume,
  getReportPDF,
  getReportXML,
  getBulkReports,
} from "./reportsrouter.js";
import {
  getSystemSettings,
  updateSystemSettings,
  getSettingsAuditLogs,
  runManualArchiving,
} from "./settingsrouter.js";

export const adminRouter = router({
  syncProfile,
  getAllReports,
  updateReport,
  getDashboardStats,
  getUrgentReports,
  getStatusDistribution,
  getMonthlyVolume,
  getSystemSettings,
  updateSystemSettings,
  updateAdminProfile,
  syncPasswordChange,
  getSettingsAuditLogs,
  getAdmins,
  getMe,
  updateAdminRole,
  inviteAdmin,
  runManualArchiving,
  getReportPDF,
  getReportXML,
  getBulkReports,
  toggleTwoFactor,
});
