import { notFound } from "next/navigation";
import { CommercialLoanApplicationForm } from "@/components/turicum/commercial-loan-application-form";
import { markPreIntakeLeadApplicationStarted } from "@/lib/turicum/pre-intake-leads";
import { withConfiguredBasePath } from "@/lib/turicum/runtime";

export const dynamic = "force-dynamic";

export default async function PrefilledApplicationPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lead = await markPreIntakeLeadApplicationStarted(token);

  if (!lead) {
    notFound();
  }

  const summary = [
    `Requested amount: ${lead.requestedAmount}`,
    `Property: ${lead.propertyType}`,
    `Location: ${lead.assetLocation}`,
    `Ownership / liens: ${lead.ownershipStatus}`,
    `Timing: ${lead.preferredTimeline}`
  ];

  return (
    <main>
      <div className="shell" style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 48px" }}>
        <section className="panel">
          <p className="eyebrow">Turicum application</p>
          <h1>Complete the full commercial loan application</h1>
          <p className="helper">
            We prefilled the information you already gave us. Finish the remaining sections so the
            Turicum team can move from the quick intake into a full review.
          </p>
        </section>

        <CommercialLoanApplicationForm
          action={withConfiguredBasePath("/api/commercial-loan-applications")}
          prefill={{
            preIntakeLeadId: lead.id,
            primaryBorrowerName: lead.fullName,
            primaryBorrowerEmail: lead.email,
            primaryBorrowerPhone: lead.phone,
            requestedAmount: lead.requestedAmount,
            propertyAddress: lead.assetLocation,
            propertyType: lead.propertyType,
            existingLiens: lead.existingLiens
          }}
          preIntakeSummary={summary}
        />
      </div>
    </main>
  );
}
