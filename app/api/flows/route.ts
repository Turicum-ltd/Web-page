import { NextResponse } from "next/server";
import { getAtlasFlowMap, saveAtlasFlowMap } from "@/lib/atlas/flow-map-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const flowMap = await getAtlasFlowMap();
  return NextResponse.json(flowMap);
}

export async function POST(request: Request) {
  const body = await request.json();
  const next = await saveAtlasFlowMap({
    records: body.records ?? [],
    edges: body.edges ?? []
  });

  return NextResponse.json(next);
}
