export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSignatureRequest, getBorrowerPortalForCase } from "@/lib/atlas/intake";
import type { CreateSignatureRequestInput, IntakeFormCode } from "@/lib/atlas/types";

function normalizeFormCode(value: string | undefined): IntakeFormCode | null {
  return value === "commercial_loan_application" ||
    value === "guarantor_authorization" ||
    value === "lender_fee_agreement"
    ? value
    : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const portal = await getBorrowerPortalForCase(id);

  if (!portal) {
    return NextResponse.json({ error: "Borrower portal not found" }, { status: 404 });
  }

  return NextResponse.json({ items: portal.signatureRequests });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<CreateSignatureRequestInput>;
    const formCode = normalizeFormCode(body.formCode);

    if (!formCode) {
      return NextResponse.json({ error: "Unknown intake form" }, { status: 400 });
    }

    const item = await createSignatureRequest(id, {
      caseId: id,
      formCode,
      provider:
        body.provider === "documenso"
          ? "documenso"
          : body.provider === "manual_upload"
            ? "manual_upload"
            : "google_workspace",
      recipientName: body.recipientName ?? "",
      recipientEmail: body.recipientEmail ?? "",
      note: body.note ?? "",
      providerRequestId: body.providerRequestId ?? "",
      providerTemplateId: body.providerTemplateId ?? "",
      providerUrl: body.providerUrl ?? "",
      googleDriveFileId: body.googleDriveFileId ?? "",
      googleDriveFolderId: body.googleDriveFolderId ?? "",
      providerStatus: body.providerStatus ?? "prepared"
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
