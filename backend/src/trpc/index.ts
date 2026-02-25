import { router } from "./init.js";

// Domain Router Assembly
import { adminRouter } from "../modules/admin/admin.router.js";
import { publicRouter } from "../modules/public/public.router.js";
import { hcpRouter } from "../modules/hcp/hcp.router.js";
import { patientRouter } from "../modules/patient/patient.router.js";
import { familyRouter } from "../modules/family/family.router.js";
import { notificationsRouter } from "../modules/notifications/notifications.router.js";

export const appRouter = router({
  admin: adminRouter,
  public: publicRouter,
  hcp: hcpRouter,
  patient: patientRouter,
  family: familyRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
