import { router } from "../../trpc/trpc.js";
import {
  syncProfile,
  updateAdminProfile,
  syncPasswordChange,
  getAdmins,
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
  runManualArchiving,
});
