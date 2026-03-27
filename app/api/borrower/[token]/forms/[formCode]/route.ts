export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getIntakeForm } from "@/lib/turicum/intake-forms";
import { getBorrowerPortalByToken, submitBorrowerPortalForm } from "@/lib/turicum/intake";
import type { IntakeFormCode, IntakeFormResponse } from "@/lib/turicum/types";

function normalizeFormCode(value: string): IntakeFormCode | null {
  return value === "commercial_loan_application" ||
    value === "guarantor_authorization" ||
    value === "lender_fee_agreement"
    ? value
    : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; formCode: string }> }
) {
  const { token, formCode } = await params;
  const normalized = normalizeFormCode(formCode);

  if (!normalized) {
    return NextResponse.json({ error: "Unknown intake form" }, { status: 404 });
  }

  const portal = await getBorrowerPortalByToken(token);

  if (!portal) {
    return NextResponse.json({ error: "Borrower portal not found" }, { status: 404 });
  }

  return NextResponse.json({
    form: getIntakeForm(normalized),
    response: portal.formResponses[normalized] ?? {}
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string; formCode: string }> }
) {
  try {
    const { token, formCode } = await params;
    const normalized = normalizeFormCode(formCode);

    if (!normalized) {
      return NextResponse.json({ error: "Unknown intake form" }, { status: 404 });
    }

    const body = (await request.json()) as IntakeFormResponse;
    const portal = await submitBorrowerPortalForm(token, normalized, body);

    return NextResponse.json({
      portal,
      response: portal.formResponses[normalized] ?? {}
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
