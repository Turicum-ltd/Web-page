import { NextResponse } from "next/server";
import { getStatePackByCode } from "@/lib/atlas/state-packs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  const { state } = await params;
  const statePack = getStatePackByCode(state);

  if (!statePack) {
    return NextResponse.json(
      {
        error: `Unknown state pack: ${state}`
      },
      { status: 404 }
    );
  }

  return NextResponse.json(statePack);
}
