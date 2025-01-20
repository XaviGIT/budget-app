"use server";

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

export async function importExcelData(file: ArrayBuffer) {
  try {
    console.log("Starting import process...");

    const workbook = XLSX.read(file, {
      cellDates: true,
      cellNF: true,
    });

    // Import Categories from "Dados" sheet
    const dadosSheet = workbook.Sheets["Dados"];
    if (!dadosSheet) {
      throw new Error("Dados sheet not found");
    }

    const dadosData = XLSX.utils.sheet_to_json(dadosSheet, { header: 1 });

    // Get categories (first column, after header)
    const categories = dadosData
      .slice(1) // Skip header row
      .map((row) => row[0]) // First column
      .filter(Boolean); // Remove empty/null values

    console.log("Processing categories:", categories);

    // Create categories
    for (const categoryName of categories) {
      if (typeof categoryName === "string") {
        const icon = categoryName.split(" ")[0]; // Get the emoji
        try {
          await prisma.category.upsert({
            where: { name: categoryName },
            update: { icon },
            create: {
              name: categoryName,
              icon,
            },
          });
          console.log(`Created/updated category: ${categoryName}`);
        } catch (error) {
          console.log(`Error with category ${categoryName}:`, error);
        }
      }
    }

    // Get accounts (from second column, after header, where name starts with 🏦)
    const accounts = dadosData
      .slice(1)
      .map((row) => ({
        name: row[1], // Second column
        balance: parseFloat(row[2] || "0"), // Third column
      }))
      .filter(
        (acc) =>
          acc.name && typeof acc.name === "string" && acc.name.startsWith("🏦")
      );

    console.log("Processing accounts:", accounts);

    // Create accounts
    for (const account of accounts) {
      try {
        await prisma.account.upsert({
          where: { name: account.name },
          update: { balance: account.balance },
          create: {
            name: account.name,
            balance: account.balance,
            type: account.balance < 0 ? "CREDIT" : "DEBIT",
          },
        });
        console.log(`Created/updated account: ${account.name}`);
      } catch (error) {
        console.log(`Error with account ${account.name}:`, error);
      }
    }

    // Import Transactions
    const cashflowSheet = workbook.Sheets["Cashflow 2025"];
    if (!cashflowSheet) {
      throw new Error("Cashflow 2025 sheet not found");
    }

    // Get the raw data first to understand the structure
    const transactionsRaw = XLSX.utils.sheet_to_json(cashflowSheet);
    console.log("Sample transaction:", transactionsRaw[0]);

    const transactions = transactionsRaw.filter((trans) => trans.Conta); // Only process rows with an account

    for (const trans of transactions) {
      try {
        const category = await prisma.category.findFirst({
          where: { name: trans.Categoria },
        });

        const account = await prisma.account.findFirst({
          where: { name: trans.Conta },
        });

        if (!category) {
          console.log(`Category not found: ${trans.Categoria}`);
          continue;
        }

        if (!account) {
          console.log(`Account not found: ${trans.Conta}`);
          continue;
        }

        await prisma.transaction.create({
          data: {
            date: new Date(trans.Data),
            payee: trans.Payee || "",
            categoryId: category.id,
            accountId: account.id,
            memo: trans.Memo || null,
            outflow: trans.Outflow || null,
            inflow: trans.Inflow || null,
          },
        });
        console.log(
          `Created transaction: ${trans.Payee} - ${
            trans.Outflow || trans.Inflow
          }`
        );
      } catch (error) {
        console.log("Error creating transaction:", trans, error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Import failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
