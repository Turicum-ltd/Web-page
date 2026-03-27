import { NextResponse } from "next/server";
import { getCaseById, listCaseChecklistItems } from "@/lib/turicum/cases";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await getCaseById(id);

  if (!item) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const checklist = await listCaseChecklistItems(id);

  return NextResponse.json({
    item,
    checklist
  });
}
