import { initTRPC } from "@trpc/server";

export interface Context {
  ip: string;
  userAgent: string;
  clientId: string | string[];
  token: string | null;
  user?: {
    id: string;
    email?: string | null;
    role: string;
    aal?: string;
    amr?: string[];
  };
}

export const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
