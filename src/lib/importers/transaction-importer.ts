"use server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";

const prisma = new PrismaClient();

export async function importTransactions(csvContent: string) {
  try {
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // This will convert numbers automatically
    });

    console.log("Parsed transactions data:", data);

    const results = [];
    for (const row of data) {
      try {
        if (!row.account || !row.date || !row.payee || !row.category) {
          console.log("Skipping invalid transaction row:", row);
          continue;
        }

        // Find related records
        const account = await prisma.account.findFirst({
          where: { name: row.account },
        });

        const category = await prisma.category.findFirst({
          where: { name: row.category },
        });

        const payee = await prisma.payee.findFirst({
          where: { name: row.payee },
        });

        if (!account || !category || !payee) {
          console.log("Skipping transaction due to missing relations:", {
            hasAccount: !!account,
            hasCategory: !!category,
            hasPayee: !!payee,
            row,
          });
          continue;
        }

        const transaction = await prisma.transaction.create({
          data: {
            date: new Date(row.date),
            accountId: account.id,
            categoryId: category.id,
            payeeId: payee.id,
            memo: row.memo || null,
            outflow: row.outflow || null,
            inflow: row.inflow || null,
          },
        });
        console.log("Created transaction:", transaction);
        results.push(transaction);
      } catch (err) {
        console.log(`Error processing transaction for ${row.payee}:`, err);
      }
    }

    return { success: true, imported: results.length };
  } catch (error) {
    console.log("Transaction import error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
