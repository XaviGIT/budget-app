"use server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";

const prisma = new PrismaClient();

export async function importPayees(csvContent: string) {
  try {
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log("Parsed payees data:", data);

    const results = [];
    for (const row of data) {
      try {
        if (!row.name || !row.icon) {
          console.log("Skipping invalid payee row:", row);
          continue;
        }

        const payee = await prisma.payee.upsert({
          where: {
            name: row.name,
          },
          update: {
            icon: row.icon,
          },
          create: {
            name: row.name,
            icon: row.icon,
          },
        });
        console.log("Created/updated payee:", payee);
        results.push(payee);
      } catch (err) {
        console.log(`Error processing payee ${row.name}:`, err);
      }
    }

    return { success: true, imported: results.length };
  } catch (error) {
    console.log("Payee import error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
