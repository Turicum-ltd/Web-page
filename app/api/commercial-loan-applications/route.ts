export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createCommercialLoanApplication } from "@/lib/turicum/commercial-loan-applications";
import { buildAppUrl } from "@/lib/turicum/runtime";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("primaryBorrowerEmail") ?? "").trim().toLowerCase();

    await createCommercialLoanApplication({
      primaryBorrowerName: String(formData.get("primaryBorrowerName") ?? ""),
      primaryBorrowerEmail: email,
      primaryBorrowerPhone: String(formData.get("primaryBorrowerPhone") ?? ""),
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
      borrowingEntityName: String(formData.get("borrowingEntityName") ?? ""),
      bankruptcyHistory: String(formData.get("bankruptcyHistory") ?? ""),
      lawsuitHistory: String(formData.get("lawsuitHistory") ?? ""),
      judgmentHistory: String(formData.get("judgmentHistory") ?? ""),
      declarationNotes: String(formData.get("declarationNotes") ?? "")
    });

    const search = new URLSearchParams({ application: "1" });
    if (email) {
      search.set("applicationEmail", email);
    }

    return NextResponse.redirect(
      `${buildAppUrl(request, `/portal?${search.toString()}`)}#request-call`,
      {
        status: 303
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit application.";
    return NextResponse.redirect(
      `${buildAppUrl(request, `/portal?error=${encodeURIComponent(message)}`)}#request-call`,
      { status: 303 }
    );
  }
}
