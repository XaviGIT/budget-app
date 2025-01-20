"use server";
import { PrismaClient } from "@prisma/client";
import Papa from "papaparse";

const prisma = new PrismaClient();

export async function importCategories(csvContent: string) {
  try {
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    console.log("Parsed CSV data:", data);

    const results = [];
    for (const row of data) {
      try {
        if (!row.name || !row.icon) {
          console.log("Skipping invalid row:", row);
          continue;
        }

        const category = await prisma.category.upsert({
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
        console.log("Created/updated category:", category);
        results.push(category);
      } catch (err) {
        console.log(`Error processing category ${row.name}:`, err);
      }
    }

    return { success: true, imported: results.length };
  } catch (error) {
    console.log("Category import error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
