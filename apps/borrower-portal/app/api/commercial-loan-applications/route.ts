export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createCommercialLoanApplication } from "@/lib/turicum/commercial-loan-applications";
import { markPreIntakeLeadApplicationSubmitted } from "@/lib/turicum/pre-intake-leads";
import { buildAppUrl } from "@/lib/turicum/runtime";

function readRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const realIp = request.headers.get("x-real-ip") ?? "";
  const candidate = forwardedFor.split(",")[0]?.trim() || realIp.trim();
  return candidate || "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("primaryBorrowerEmail") ?? "").trim().toLowerCase();
    const submittedAt = new Date().toISOString();
    const submittedIpAddress = readRequestIp(request);
    const ownershipTableRaw = String(formData.get("ownershipTable") ?? "").trim();
    let ownershipTable: Array<{ name: string; title: string; percentOwned: string }> = [];

    if (ownershipTableRaw) {
      try {
        const parsed = JSON.parse(ownershipTableRaw);
        if (Array.isArray(parsed)) {
          ownershipTable = parsed
            .filter((item) => item && typeof item === "object")
            .map((item) => ({
              name: String((item as Record<string, unknown>).name ?? ""),
              title: String((item as Record<string, unknown>).title ?? ""),
              percentOwned: String((item as Record<string, unknown>).percentOwned ?? "")
            }));
        }
      } catch {
        ownershipTable = [];
      }
    }

    const saved = await createCommercialLoanApplication({
      primaryBorrowerName: String(formData.get("primaryBorrowerName") ?? ""),
      primaryBorrowerEmail: email,
      primaryBorrowerPhone: String(formData.get("primaryBorrowerPhone") ?? ""),
      socialSecurityNumber: String(formData.get("socialSecurityNumber") ?? ""),
      coBorrowerName: String(formData.get("coBorrowerName") ?? ""),
      coBorrowerEmail: String(formData.get("coBorrowerEmail") ?? ""),
      currentAddress: String(formData.get("currentAddress") ?? ""),
      formerAddress: String(formData.get("formerAddress") ?? ""),
      annualIncome: String(formData.get("annualIncome") ?? ""),
      cashOnHand: String(formData.get("cashOnHand") ?? ""),
      realEstateAssets: String(formData.get("realEstateAssets") ?? ""),
      retirementAssets: String(formData.get("retirementAssets") ?? ""),
      mortgageDebt: String(formData.get("mortgageDebt") ?? ""),
      creditorDebt: String(formData.get("creditorDebt") ?? ""),
      otherLiabilities: String(formData.get("otherLiabilities") ?? ""),
      requestedAmount: String(formData.get("requestedAmount") ?? ""),
      propertyAddress: String(formData.get("propertyAddress") ?? ""),
      propertyType: String(formData.get("propertyType") ?? ""),
      constructionType: String(formData.get("constructionType") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      purchasePrice: String(formData.get("purchasePrice") ?? ""),
      sourceOfDownPayment: String(formData.get("sourceOfDownPayment") ?? ""),
      yearAcquired: String(formData.get("yearAcquired") ?? ""),
      originalCost: String(formData.get("originalCost") ?? ""),
      existingLiens: String(formData.get("existingLiens") ?? ""),
      estimatedPresentValue: String(formData.get("estimatedPresentValue") ?? ""),
      borrowingEntityName: String(formData.get("exactNameOfEntityForTitle") ?? formData.get("borrowingEntityName") ?? ""),
      exactNameOfEntityForTitle: String(formData.get("exactNameOfEntityForTitle") ?? ""),
      entityType: String(formData.get("entityType") ?? ""),
      ownershipTable,
      businessTaxId: String(formData.get("businessTaxId") ?? ""),
      dateEstablished: String(formData.get("dateEstablished") ?? ""),
      numberOfEmployees: String(formData.get("numberOfEmployees") ?? ""),
      primaryBusinessAddress: String(formData.get("primaryBusinessAddress") ?? ""),
      bankruptcyHistory: String(formData.get("bankruptcyHistory") ?? ""),
      foreclosureHistory: String(formData.get("foreclosureHistory") ?? ""),
      lawsuitHistory: String(formData.get("lawsuitHistory") ?? ""),
      judgmentHistory: String(formData.get("judgmentHistory") ?? ""),
      delinquentDebtHistory: String(formData.get("delinquentDebtHistory") ?? ""),
      taxLienHistory: String(formData.get("taxLienHistory") ?? ""),
      declarationNotes: String(formData.get("declarationNotes") ?? ""),
      consentFullLegalName: String(formData.get("consentFullLegalName") ?? ""),
      submittedAt,
      submittedIpAddress
    });

    const preIntakeLeadId = String(formData.get("preIntakeLeadId") ?? "").trim();

    if (preIntakeLeadId) {
      await markPreIntakeLeadApplicationSubmitted({
        leadId: preIntakeLeadId,
        applicationId: saved.id
      });
    }

    const search = new URLSearchParams({ application: "1" });
    if (email) {
      search.set("applicationEmail", email);
    }

    return NextResponse.redirect(
      `${buildAppUrl(request, `/?${search.toString()}`)}#scheduler`,
      {
        status: 303
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit application.";
    return NextResponse.redirect(
      `${buildAppUrl(request, `/?error=${encodeURIComponent(message)}`)}#scheduler`,
      { status: 303 }
    );
  }
}
