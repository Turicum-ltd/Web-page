import { NextResponse } from "next/server";
import { createCase, listCases } from "@/lib/turicum/cases";
import type { NewCaseInput } from "@/lib/turicum/types";

export async function GET() {
  const items = await listCases();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<NewCaseInput>;

    const item = await createCase({
      title: body.title ?? "",
      state: body.state ?? "",
      structureType: body.structureType === "loan" ? "loan" : "purchase",
      sourceType: body.sourceType ?? "direct",
      requestedAmount: body.requestedAmount ?? "0",
      propertySummary: body.propertySummary ?? ""
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 400 }
    );
  }
}
