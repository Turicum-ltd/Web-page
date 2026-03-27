import { NextResponse } from "next/server";
import { getStatePacks } from "@/lib/turicum/state-packs";

export function GET() {
  return NextResponse.json({
    items: getStatePacks()
  });
}
