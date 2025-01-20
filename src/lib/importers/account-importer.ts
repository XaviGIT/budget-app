"use server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";

const prisma = new PrismaClient();

export async function importAccounts(csvContent: string) {
  try {
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // This will automatically convert numbers
    });

    console.log("Parsed accounts data:", data);

    const results = [];
    for (const row of data) {
      try {
        if (!row.name || row.balance === undefined || !row.type) {
          console.log("Skipping invalid account row:", row);
          continue;
        }

        const account = await prisma.account.upsert({
          where: {
            name: row.name,
          },
          update: {
            balance: row.balance,
            type: row.type,
          },
          create: {
            name: row.name,
            balance: row.balance,
            type: row.type,
          },
        });
        console.log("Created/updated account:", account);
        results.push(account);
      } catch (err) {
        console.log(`Error processing account ${row.name}:`, err);
      }
    }

    return { success: true, imported: results.length };
  } catch (error) {
    console.log("Account import error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
