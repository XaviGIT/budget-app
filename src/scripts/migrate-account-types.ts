import { PrismaClient, AccountType } from "@prisma/client";

const prisma = new PrismaClient();

// Define account type mappings
const SAVINGS_KEYWORDS = ["savings", "investment", "trade", "stoik", "degiro"];
const CREDIT_KEYWORDS = ["credit", "cetelem", "unibanco"];

function determineAccountType(accountName: string): AccountType {
  const lowerName = accountName.toLowerCase();

  if (CREDIT_KEYWORDS.some((keyword) => lowerName.includes(keyword))) {
    return "CREDIT";
  }

  if (SAVINGS_KEYWORDS.some((keyword) => lowerName.includes(keyword))) {
    return "SAVINGS";
  }

  return "DEBIT";
}

async function migrateAccountTypes() {
  const accounts = await prisma.account.findMany();
  console.log(`Found ${accounts.length} accounts to migrate`);

  for (const account of accounts) {
    const newType = determineAccountType(account.name);
    console.log(`Migrating ${account.name} to ${newType}`);

    await prisma.account.update({
      where: { id: account.id },
      data: { type: newType },
    });
  }
}

migrateAccountTypes()
  .then(() => {
    console.log("Migration complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
