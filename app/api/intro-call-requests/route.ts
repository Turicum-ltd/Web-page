export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createBorrowerIntroCallRequest } from "@/lib/turicum/borrower-intro-requests";
import { buildAppUrl } from "@/lib/turicum/runtime";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    await createBorrowerIntroCallRequest({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      requestedAmount: String(formData.get("requestedAmount") ?? ""),
      assetLocation: String(formData.get("assetLocation") ?? ""),
      propertyType: String(formData.get("propertyType") ?? ""),
      preferredDate: String(formData.get("preferredDate") ?? ""),
      preferredTimeWindow: String(formData.get("preferredTimeWindow") ?? ""),
      preferredTimeline: String(formData.get("preferredTimeline") ?? ""),
      notes: String(formData.get("notes") ?? "")
    });

    return NextResponse.redirect(`${buildAppUrl(request, "/portal?requested=1")}#request-call`, {
      status: 303
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit request.";
    return NextResponse.redirect(
      `${buildAppUrl(request, `/portal?error=${encodeURIComponent(message)}`)}#request-call`,
      { status: 303 }
    );
  }
}
