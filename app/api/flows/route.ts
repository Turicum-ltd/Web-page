import { NextResponse } from "next/server";
import { getTuricumFlowMap, saveTuricumFlowMap } from "@/lib/turicum/flow-map-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const flowMap = await getTuricumFlowMap();
  return NextResponse.json(flowMap);
}

export async function POST(request: Request) {
  const body = await request.json();
  const next = await saveTuricumFlowMap({
    records: body.records ?? [],
    edges: body.edges ?? []
  });

  return NextResponse.json(next);
}
