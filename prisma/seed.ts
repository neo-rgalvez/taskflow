import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create or update the dev user with a known password
  const passwordHash = await bcrypt.hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "sarah@fletcherdesign.co" },
    update: { passwordHash },
    create: {
      id: "dev_user_1",
      email: "sarah@fletcherdesign.co",
      name: "Sarah Fletcher",
      passwordHash,
      emailVerified: true,
      timezone: "America/New_York",
    },
  });

  console.log("Seeded dev user: sarah@fletcherdesign.co / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
