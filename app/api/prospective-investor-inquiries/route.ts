export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createProspectiveInvestorInquiry } from "@/lib/turicum/prospective-investor-inquiries";
import { buildAppUrl } from "@/lib/turicum/runtime";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    await createProspectiveInvestorInquiry({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      linkedInProfile: String(formData.get("linkedInProfile") ?? ""),
      typicalInvestmentSize: String(formData.get("typicalInvestmentSize") ?? "")
    });

    return NextResponse.redirect(`${buildAppUrl(request, "/investors?inquiry=1")}#prospective-investor`, {
      status: 303
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit investor inquiry.";
    return NextResponse.redirect(
      `${buildAppUrl(request, `/investors?inquiry_error=${encodeURIComponent(message)}`)}#prospective-investor`,
      { status: 303 }
    );
  }
}
