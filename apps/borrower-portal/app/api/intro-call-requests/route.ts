export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { enqueueOutboundEmail } from "@/lib/turicum/outbound-email-queue";
import {
  createPreIntakeLead,
  markPreIntakeLeadSummaryEmailQueued
} from "@/lib/turicum/pre-intake-leads";
import { buildAppUrl } from "@/lib/turicum/runtime";

function buildLeadSummaryEmailText(formData: FormData) {
  return [
    `Hi ${String(formData.get("fullName") ?? "").trim() || "there"},`,
    "",
    "We received your Turicum quick asset intake.",
    "",
    `Requested amount: ${String(formData.get("requestedAmount") ?? "").trim()}`,
    `Property type: ${String(formData.get("propertyType") ?? "").trim()}`,
    `Location: ${String(formData.get("assetLocation") ?? "").trim()}`,
    `Ownership / liens: ${String(formData.get("ownershipStatus") ?? "").trim()}`,
    `Purchase date: ${String(formData.get("purchaseDate") ?? "").trim()}`,
    `Purchase price: ${String(formData.get("purchasePrice") ?? "").trim()}`,
    `Capital invested: ${String(formData.get("capitalInvested") ?? "").trim()}`,
    `Existing liens: ${String(formData.get("existingLiens") ?? "").trim()}`,
    `Title held: ${String(formData.get("titleHeld") ?? "").trim()}`,
    `Estimated value: ${String(formData.get("estimatedValue") ?? "").trim()}`,
    `Value basis: ${String(formData.get("valueBasis") ?? "").trim()}`,
    `Timing: ${String(formData.get("preferredTimeline") ?? "").trim()}`,
    "",
    "A Turicum director will call you within 1 hour during business hours.",
    "",
    "Best,",
    "Turicum"
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    const lead = await createPreIntakeLead({
      fullName: String(formData.get("fullName") ?? ""),
      email,
      phone: String(formData.get("phone") ?? ""),
      requestedAmount: String(formData.get("requestedAmount") ?? ""),
      assetLocation: String(formData.get("assetLocation") ?? ""),
      propertyType: String(formData.get("propertyType") ?? ""),
      assetDescription: String(formData.get("assetDescription") ?? ""),
      ownershipStatus: String(formData.get("ownershipStatus") ?? ""),
      purchaseDate: String(formData.get("purchaseDate") ?? ""),
      purchasePrice: String(formData.get("purchasePrice") ?? ""),
      capitalInvested: String(formData.get("capitalInvested") ?? ""),
      existingLiens: String(formData.get("existingLiens") ?? ""),
      titleHeld: String(formData.get("titleHeld") ?? ""),
      estimatedValue: String(formData.get("estimatedValue") ?? ""),
      valueBasis: String(formData.get("valueBasis") ?? ""),
      preferredTimeline: String(formData.get("preferredTimeline") ?? "")
    });

    if (email) {
      await enqueueOutboundEmail({
        templateKey: "pre_intake_summary",
        to: email,
        subject: "Turicum Quick Asset Intake Summary",
        text: buildLeadSummaryEmailText(formData),
        metadata: {
          leadId: lead.id,
          fullName: lead.fullName
        }
      });
      await markPreIntakeLeadSummaryEmailQueued(lead.id);
    }

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
