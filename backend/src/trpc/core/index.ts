import { router, t } from "./init.js";

// Domain Router Assembly
import { adminRouter } from "../../modules/admin/admin.router.js";
import { publicRouter } from "../../modules/public/public.router.js";
import { contactRouter } from "../../modules/public/contact.router.js";
import { hcpRouter } from "../../modules/hcp/hcp.router.js";
import { patientRouter } from "../../modules/patient/patient.router.js";
import { familyRouter } from "../../modules/family/family.router.js";
import { notificationsRouter } from "../../modules/notifications/notifications.router.js";
import { translationRouter } from "../../modules/translation/translationRouter.js";
import { referenceRouter } from "../../modules/meddra/reference.router.js";
import { importRouter } from "../../modules/meddra/import.router.js";

export const appRouter = router({
  admin: adminRouter,
  public: publicRouter,
  contact: contactRouter,
  hcp: hcpRouter,
  patient: patientRouter,
  family: familyRouter,
  notifications: notificationsRouter,
  translation: translationRouter,
  reference: t.mergeRouters(referenceRouter, importRouter),
});

export type AppRouter = typeof appRouter;
