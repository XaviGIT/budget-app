import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateAccounts() {
  const accounts = await prisma.account.findMany();

  for (const account of accounts) {
    // Check if a payee with this name already exists
    const existingPayee = await prisma.payee.findFirst({
      where: { name: account.name },
    });

    if (!existingPayee) {
      await prisma.payee.create({
        data: {
          name: account.name,
          icon: account.name.split(" ")[0],
          accountId: account.id,
        },
      });
    }
  }
}

migrateAccounts()
  .then(() => {
    console.log("Migration complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
