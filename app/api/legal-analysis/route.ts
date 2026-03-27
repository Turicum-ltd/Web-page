import { NextResponse } from "next/server";
import { getLatestLegalCorpusAnalysis } from "@/lib/turicum/legal-analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  const analysis = getLatestLegalCorpusAnalysis();

  if (!analysis) {
    return NextResponse.json({ ok: false, error: "Turicum LLC legal corpus analysis not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, analysis });
}
