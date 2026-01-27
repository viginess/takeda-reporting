import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../backend/src/routers/app";

export const trpc = createTRPCReact<AppRouter>();
