export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createBorrowerIntroCallRequest } from "@/lib/turicum/borrower-intro-requests";
import { buildAppUrl } from "@/lib/turicum/runtime";

function buildStructuredNotes(formData: FormData) {
  const lines = [
    ["Property description", String(formData.get("assetDescription") ?? "").trim()],
    ["Ownership / lien status", String(formData.get("ownershipStatus") ?? "").trim()],
    ["Purchase date", String(formData.get("purchaseDate") ?? "").trim()],
    ["Purchase price", String(formData.get("purchasePrice") ?? "").trim()],
    ["Capital invested", String(formData.get("capitalInvested") ?? "").trim()],
    ["Existing loans or liens", String(formData.get("existingLiens") ?? "").trim()],
    ["Title held", String(formData.get("titleHeld") ?? "").trim()],
    ["Estimated current value", String(formData.get("estimatedValue") ?? "").trim()],
    ["Value basis", String(formData.get("valueBasis") ?? "").trim()]
  ].filter(([, value]) => value);

  return lines.map(([label, value]) => `${label}: ${value}`).join("\n");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    await createBorrowerIntroCallRequest({
      fullName: String(formData.get("fullName") ?? ""),
      email,
      phone: String(formData.get("phone") ?? ""),
      requestedAmount: String(formData.get("requestedAmount") ?? ""),
      assetLocation: String(formData.get("assetLocation") ?? ""),
      propertyType: String(formData.get("propertyType") ?? ""),
      preferredTimeline: String(formData.get("preferredTimeline") ?? ""),
      notes: buildStructuredNotes(formData)
    });

    const search = new URLSearchParams({ requested: "1" });
    if (email) {
      search.set("requestedEmail", email);
    }

    return NextResponse.redirect(`${buildAppUrl(request, `/?${search.toString()}`)}#request-form`, {
      status: 303
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit request.";
    return NextResponse.redirect(
      `${buildAppUrl(request, `/?error=${encodeURIComponent(message)}`)}#request-form`,
      { status: 303 }
    );
  }
}
