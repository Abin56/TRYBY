// Run once to create the SuperAdmin profile for admin@tryby.in
// Usage: npx tsx scripts/setup-super-admin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email    = process.argv[2] ?? "admin@tryby.in";
  const password = process.argv[3] ?? "Admin@1234";   // change immediately after first login

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.error(`❌ User ${email} not found`); process.exit(1); }

  const passwordHash = await bcrypt.hash(password, 12);

  const profile = await prisma.adminProfile.upsert({
    where:  { userId: user.id },
    update: { adminRole: "SUPER_ADMIN", passwordHash, permissions: [], isDisabled: false, mustResetPwd: false },
    create: {
      userId:       user.id,
      adminRole:    "SUPER_ADMIN",
      passwordHash,
      permissions:  [],
      isDisabled:   false,
      mustResetPwd: false,
    },
  });

  console.log(`✅ SuperAdmin profile created/updated`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${profile.adminRole}`);
  console.log(`\n⚠️  Change the password immediately after logging in.`);
}

main()
  .catch(e => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
