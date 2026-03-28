import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../backend/src/trpc/core";

export const trpc = createTRPCReact<AppRouter>();
