import { importExcelData } from "@/lib/utils/import-data";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const arrayBuffer = await request.arrayBuffer();
    console.log("Received file, size:", arrayBuffer.byteLength);

    const result = await importExcelData(arrayBuffer);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to import data",
      },
      { status: 500 }
    );
  }
}
