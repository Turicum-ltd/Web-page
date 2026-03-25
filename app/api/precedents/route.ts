import { NextResponse } from "next/server";
import { listPrecedents } from "@/lib/atlas/precedents";

export function GET() {
  return NextResponse.json({
    items: listPrecedents()
  });
}
