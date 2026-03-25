import { NextResponse } from "next/server";
import { getStatePacks } from "@/lib/atlas/state-packs";

export function GET() {
  return NextResponse.json({
    items: getStatePacks()
  });
}
