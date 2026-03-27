import { NextResponse } from "next/server";
import { listPrecedents } from "@/lib/turicum/precedents";

export function GET() {
  return NextResponse.json({
    items: listPrecedents()
  });
}
