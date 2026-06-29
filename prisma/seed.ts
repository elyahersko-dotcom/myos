import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Idempotent seed — only ensures the admin login exists.
// No demo clients/tasks/invoices are created, so running this
// repeatedly (e.g. on every deploy) never duplicates data.
async function main() {
  console.log("Seeding admin user…");
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
