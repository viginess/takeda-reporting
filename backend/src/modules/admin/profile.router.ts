import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
  protectedProcedure,
  mfaProtectedProcedure,
} from "../../trpc/trpc.js";
import { db } from "../../db/index.js";
import { admins } from "../../db/schema.js";

export const syncProfile = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      email: z.string().email(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const [row] = await db
        .insert(admins)
        .values({
          id: input.id,
          email: input.email,
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockedAt: null,
        })
        .onConflictDoUpdate({
          target: admins.id,
          set: {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedAt: null,
            updatedAt: new Date(),
          },
        })
        .returning();

      return { success: true, data: row };
    } catch (err: any) {
      console.error("Error in syncProfile:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to sync admin profile",
      });
    }
  });

export const updateAdminProfile = mfaProtectedProcedure
  .input(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const adminId = ctx.user.id;
    const [row] = await db
      .update(admins)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, adminId))
      .returning();

    return { success: true, data: row };
  });

export const syncPasswordChange = protectedProcedure.mutation(async ({ ctx }) => {
  const adminId = ctx.user.id;
  const [row] = await db
    .update(admins)
    .set({
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(admins.id, adminId))
    .returning();

  return { success: true, data: row };
});

export const getAdmins = mfaProtectedProcedure.query(async ({ ctx }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Admin access required",
    });
  }

  return await db.select().from(admins).orderBy(admins.email);
});

