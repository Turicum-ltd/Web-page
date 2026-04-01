export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createProspectiveInvestorInquiry } from "@/lib/turicum/prospective-investor-inquiries";
import { buildAppUrl } from "@/lib/turicum/runtime";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const expectsJson = contentType.includes("application/json");
    const payload = expectsJson ? await request.json() : null;
    const formData = expectsJson ? null : await request.formData();

    await createProspectiveInvestorInquiry({
      fullName: expectsJson ? String(payload?.fullName ?? "") : String(formData?.get("fullName") ?? ""),
      email: expectsJson ? String(payload?.email ?? "") : String(formData?.get("email") ?? ""),
      linkedInProfile: expectsJson ? String(payload?.linkedInProfile ?? "") : String(formData?.get("linkedInProfile") ?? ""),
      typicalInvestmentSize: expectsJson
        ? String(payload?.targetAllocationSize ?? payload?.typicalInvestmentSize ?? "")
        : String(formData?.get("typicalInvestmentSize") ?? ""),
      accreditedInvestor: expectsJson ? String(payload?.accreditedInvestor ?? "") : "",
      primaryInvestmentObjective: expectsJson ? String(payload?.primaryInvestmentObjective ?? "") : "",
      source: expectsJson ? "gatekeeper_questionnaire" : "legacy_form"
    });

    if (expectsJson) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.redirect(`${buildAppUrl(request, "/investors?inquiry=1")}#prospective-investor`, {
      status: 303
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit investor inquiry.";
    if ((request.headers.get("content-type") ?? "").includes("application/json")) {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    return NextResponse.redirect(
      `${buildAppUrl(request, `/investors?inquiry_error=${encodeURIComponent(message)}`)}#prospective-investor`,
      { status: 303 }
    );
  }
}
