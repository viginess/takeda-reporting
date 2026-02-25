import { router } from "../../trpc/init.js";
import {
  syncProfile,
  updateAdminProfile,
  syncPasswordChange,
  getAdmins,
  getMe,
  updateAdminRole,
  inviteAdmin,
} from "./profile.router.js";
import {
  getAllReports,
  updateReport,
  getDashboardStats,
  getUrgentReports,
  getStatusDistribution,
  getMonthlyVolume,
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
});
