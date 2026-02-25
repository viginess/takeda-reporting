import { db } from "../src/db/index.js";
import { admins } from "../src/db/admin/admin.schema.js";
import { eq } from "drizzle-orm";

async function makeSuperAdmin() {
  console.log("Fetching users...");
  const users = await db.select().from(admins);
  
  if (users.length === 0) {
    console.log("No admins found in database.");
    process.exit(0);
  }

  console.log("Found admins:");
  users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));

  // Let's just make the first one a super_admin for now
  const targetUser = users[0];
  console.log(`\nPromoting ${targetUser.email} to super_admin...`);
  
  await db.update(admins)
    .set({ role: "super_admin" })
    .where(eq(admins.id, targetUser.id));

  console.log("Success! They are now a super_admin.");
  process.exit(0);
}

makeSuperAdmin().catch(console.error);
