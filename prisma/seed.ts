import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Idempotent seed — only ensures the admin login exists.
// No demo clients/tasks/invoices are created, so running this
// repeatedly (e.g. on every deploy) never duplicates data.
//
// Locked out? Set ADMIN_RESET_PASSWORD (and optionally ADMIN_RESET_EMAIL) in the
// environment and redeploy: the admin's password is overwritten with that value.
// Remove the variable afterwards so it doesn't reset on every deploy.
async function main() {
  const email = process.env.ADMIN_RESET_EMAIL || "admin@myos.com";
  const resetPassword = process.env.ADMIN_RESET_PASSWORD;

  if (resetPassword) {
    const password = await bcrypt.hash(resetPassword, 10);
    await prisma.user.upsert({
      where: { email },
      update: { password, resetCode: null, resetCodeExpires: null },
      create: { email, password, name: "Admin" },
    });
    console.log(`Password for ${email} was reset from ADMIN_RESET_PASSWORD. Remove that variable now.`);
    return;
  }

  const password = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@myos.com" },
    update: {},
    create: { email: "admin@myos.com", password, name: "Admin" },
  });
  console.log("Done. Login: admin@myos.com / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
