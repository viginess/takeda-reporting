import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import {
  protectedProcedure,
  viewerProcedure,
  superAdminProcedure,
} from "../../trpc/procedures.js";
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
      // Check if this is the very first user in the database
      const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(admins);
      
      const isFirstUser = count === 0;

      const [row] = await db
        .insert(admins)
        .values({
          id: input.id,
          email: input.email,
          role: "super_admin",
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

export const updateAdminProfile = viewerProcedure
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

export const getMe = viewerProcedure.query(async ({ ctx }) => {
  const adminId = ctx.user.id;
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, adminId));

  if (!admin) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Admin profile not found.",
    });
  }

  return admin;
});

export const getAdmins = superAdminProcedure.query(async () => {
  return await db.select().from(admins).orderBy(admins.email);
});

export const updateAdminRole = superAdminProcedure
  .input(
    z.object({
      adminId: z.string().uuid(),
      role: z.enum(["super_admin", "admin", "viewer"]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Prevent self-demotion as a safeguard
    if (input.adminId === ctx.user.id && input.role !== "super_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot demote your own Super Admin role.",
      });
    }

    const [updated] = await db
      .update(admins)
      .set({
        role: input.role,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, input.adminId))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Admin user not found.",
      });
    }

    return { success: true, data: updated };
  });

export const inviteAdmin = superAdminProcedure
  .input(
    z.object({
      email: z.string().email(),
      role: z.enum(["super_admin", "admin", "viewer"]),
      redirectTo: z.string().url().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Supabase Service Role Key is not configured. Cannot invite users.",
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let authDataFinal;

    // 1. Invite user via Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      input.email,
      {
        redirectTo: input.redirectTo || "http://localhost:5173/admin/reset-password",
      }
    );

    if (authError) {
      if (authError.message.includes("already been registered") || authError.status === 422) {
        // Ghost account check
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData.users.find((u: any) => u.email === input.email);

        if (existingUser) {
          // If they've never actually signed in (ghost / unconfirmed account), it's safe to clear them out
          if (!existingUser.last_sign_in_at) {
            await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
            // Re-invite them cleanly so they get the fresh setup email
            const { data: retryData, error: retryError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
              input.email,
              { redirectTo: input.redirectTo || "http://localhost:5173/admin/reset-password" }
            );

            if (retryError) {
              throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to re-invite the user." });
            }
            authDataFinal = retryData;
          } else {
            // They have actually logged in before, meaning they have a real password and session.
            throw new TRPCError({
              code: "CONFLICT",
              message: "This user is already an active administrator. To change their access, modify their role in the 'Existing Admins' list.",
            });
          }
        } else {
           throw new TRPCError({
             code: "CONFLICT",
             message: "This email address is already registered in the system.",
           });
        }
      } else {
        console.error("Error inviting user via Supabase:", authError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: authError.message || "Failed to invite user via Supabase.",
        });
      }
    } else {
      authDataFinal = authData;
    }

    if (!authDataFinal?.user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user in Supabase.",
      });
    }

    const newUserId = authDataFinal.user.id;

    // 2. Insert into our admins table, so they immediately have the defined role
    try {
      const [row] = await db
        .insert(admins)
        .values({
          id: newUserId,
          email: input.email,
          role: input.role,
          lastLoginAt: null,
          failedLoginAttempts: 0,
          lockedAt: null,
        })
        .onConflictDoUpdate({
          target: admins.id,
          set: {
            role: input.role,
            updatedAt: new Date(),
          },
        })
        .returning();

      return { success: true, data: row };
    } catch (dbErr: any) {
      console.error("Error creating admin record after invite:", dbErr);
      // Depending on the use-case, we might want to delete the auth user if this fails, or let it slide.
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "User was invited but failed to create admin profile record.",
      });
    }
  });
