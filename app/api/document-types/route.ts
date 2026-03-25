import { NextResponse } from "next/server";
import { getDocumentTypes } from "@/lib/atlas/state-packs";

export function GET() {
  return NextResponse.json({
    items: getDocumentTypes()
  });
}
