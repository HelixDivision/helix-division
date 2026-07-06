import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Manual verification helper — not part of app runtime. Sets a test
 * account's role to ADMIN so Phase 7's proxy.ts role-gating can be checked
 * end-to-end without an Admin Dashboard to grant roles through yet (that's
 * Phase 9). Usage: `npx tsx scripts/promote-admin.ts someone@example.com`.
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/promote-admin.ts <email>");
    process.exitCode = 1;
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const db = new PrismaClient({ adapter });

  const user = await db.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`Promoted ${user.email} to ADMIN.`);

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
