export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAssignedIntakeForms } from "@/lib/atlas/intake-forms";
import {
  getBorrowerPortalForCase,
  getBorrowerPortalNextSteps,
  getBorrowerPortalSummary,
  saveBorrowerPortalSetup
} from "@/lib/atlas/intake";
import type { BorrowerPortalSetupInput, IntakeFormCode } from "@/lib/atlas/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const portal = await getBorrowerPortalForCase(id);

  if (!portal) {
    return NextResponse.json({ error: "Case intake portal not found" }, { status: 404 });
  }

  return NextResponse.json({
    portal,
    forms: getAssignedIntakeForms(portal.assignedForms),
    summary: getBorrowerPortalSummary(portal),
    nextSteps: getBorrowerPortalNextSteps(portal)
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<BorrowerPortalSetupInput>;
    const assignedForms = (body.assignedForms ?? []).filter(
      (value): value is IntakeFormCode =>
        value === "commercial_loan_application" ||
        value === "guarantor_authorization" ||
        value === "lender_fee_agreement"
    );

    const portal = await saveBorrowerPortalSetup(id, {
      borrowerName: body.borrowerName ?? "",
      borrowerEmail: body.borrowerEmail ?? "",
      portalTitle: body.portalTitle ?? "",
      assignedForms
    });

    return NextResponse.json({
      portal,
      forms: getAssignedIntakeForms(portal.assignedForms),
      summary: getBorrowerPortalSummary(portal),
      nextSteps: getBorrowerPortalNextSteps(portal)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
