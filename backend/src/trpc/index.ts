import { router, publicProcedure } from "./trpc.js";
import { patientRouter } from "../modules/patient/patient.router.js";
import { hcpRouter } from "../modules/hcp/hcp.router.js";
import { familyRouter } from "../modules/family/family.router.js";
import { adminRouter } from "../modules/admin/admin.router.js";

export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok", timestamp: new Date() })),
  patient: patientRouter,
  hcp: hcpRouter,
  family: familyRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
