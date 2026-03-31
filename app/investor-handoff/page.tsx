export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { listCases } from "@/lib/turicum/cases";
import { getCaseInvestorPromotion } from "@/lib/turicum/investor-promotion";
import { getCaseServicingRecord } from "@/lib/turicum/lifecycle";
import { withBasePath } from "@/lib/turicum/runtime";

export const metadata: Metadata = {
  title: "Turicum Investors | Investor Materials",
  description: "Investor materials for disciplined capital reviewing promoted first-lien, asset-based opportunities, servicing visibility, and resolution posture."
};

function formatLabel(value: string | undefined) {
  return (value ?? "not set").replaceAll("_", " ");
}

function buildHeadline(title: string, promotedHeadline: string | undefined) {
  return promotedHeadline?.trim() || title;
}

function buildPromotionSummary(summary: string | undefined) {
  return summary?.trim() || "Promotion details will appear once Turicum releases the investor-facing deal note.";
}

function buildDistributionSummary(summary: string | undefined) {
  return summary?.trim() || "Servicing distribution details will appear once the deal is funded and active.";
}

export default async function InvestorHandoffPage() {
  const cases = await listCases();
  const featuredCases = await Promise.all(
    cases.slice(0, 3).map(async (item) => ({
      item,
      promotion: await getCaseInvestorPromotion(item.id),
      servicing: await getCaseServicingRecord(item.id)
    }))
  );

  return (
    <main>
      <div className="shell turicum-investor-shell turicum-public-shell">
        <section className="hero turicum-public-hero turicum-investor-hero">
          <div className="hero-grid turicum-public-hero-grid turicum-investor-hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Investor Materials</p>
              <div className="hero-brand-lockup">
                <TuricumWordmark />
              </div>
              <h1>Investor materials for boutique private credit.</h1>
              <p>
                Review the investment posture, promoted deal visibility, servicing cadence, and resolution path in a format built for capital partners rather than the internal team workflow.
              </p>
              <div className="kicker-row">
                <span className="tag">first-lien discipline</span>
                <span className="tag">passive income posture</span>
                <span className="tag">monthly updates</span>
                <span className="tag">resolution visibility</span>
              </div>
              <div className="form-actions turicum-inline-actions">
                <Link className="secondary-button turicum-primary-button" href={withBasePath("/investors")}>
                  Investor login
                </Link>
                <Link className="secondary-button" href={withBasePath("/")}>
                  Back to overview
                </Link>
              </div>
            </div>
            <div className="turicum-public-aside turicum-investor-aside">
              <div className="panel subtle turicum-aside-panel">
                <p className="eyebrow">Investor lane</p>
                <ul className="list compact-list turicum-tight-list">
                  <li>Promoted matters only after Turicum clears the deal for investors</li>
                  <li>Monthly servicing posture, reserve notes, and distribution visibility</li>
                  <li>Resolution tracking across payoff, extension, refinance, and rollover</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="panel turicum-investor-proof-panel">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">Why investors look here first</p>
              <h2>Selection, passive income posture, and collateral clarity before portal access.</h2>
            </div>
          </div>
          <div className="status-grid turicum-compact-status-grid">
            <article className="status-card turicum-public-card turicum-nested-card">
              <p className="eyebrow">Selection</p>
              <strong>Promoted opportunities, not generic volume.</strong>
              <p className="helper">Deals appear here only after Turicum clears intake, validation, and promotion readiness.</p>
            </article>
            <article className="status-card turicum-public-card turicum-nested-card">
              <p className="eyebrow">Income posture</p>
              <strong>Attractive passive returns.</strong>
              <p className="helper">The investor lane is built around a fixed-income style lens with clear reporting and a defined servicing cadence.</p>
            </article>
            <article className="status-card turicum-public-card turicum-nested-card">
              <p className="eyebrow">Security</p>
              <strong>First-lien collateral stays central.</strong>
              <p className="helper">Investors follow the structure, servicing posture, and resolution path with first-lien visibility throughout the life of the deal.</p>
            </article>
          </div>
        </section>

        <section className="two-up turicum-form-layout">
          <div className="panel turicum-public-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">What investors see</p>
                <h2>The parts of the deal that matter in the investor lane.</h2>
              </div>
            </div>
            <ul className="list compact-list turicum-tight-list">
              <li><strong>Promoted summary:</strong> headline, deal posture, and investor-facing summary after validation.</li>
              <li><strong>Capital structure:</strong> final structure, investor count, and lead investor visibility.</li>
              <li><strong>Servicing posture:</strong> reserve notes, payment tracking, and update cadence after funding.</li>
              <li><strong>Resolution path:</strong> payoff, extension, refinance, or rollover direction as the deal matures.</li>
            </ul>
          </div>

          <div className="panel turicum-public-card">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">What Turicum handles internally</p>
                <h2>The work investors should not have to parse.</h2>
              </div>
            </div>
            <ul className="list compact-list turicum-tight-list">
              <li><strong>Validation:</strong> collateral, sponsor, and document review before the deal is promoted.</li>
              <li><strong>Legal:</strong> document selection, AI review, and legal approval.</li>
              <li><strong>Diligence:</strong> title, insurance, and tax clearance.</li>
              <li><strong>Execution and funding:</strong> signatures, escrow, reserves, and money movement.</li>
            </ul>
            <p className="helper">
              Investors should see the result of those controls, not the underlying operating checklist.
            </p>
          </div>
        </section>

        <section className="panel turicum-investor-matters-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Current investor summaries</p>
              <h2>Promoted matters, servicing visibility, and next update cadence</h2>
            </div>
          </div>
          <div className="status-grid turicum-investor-matters-grid">
            {featuredCases.length === 0 ? (
              <article className="status-card turicum-investor-matter-card">
                <strong>No promoted matters yet.</strong>
                <p className="helper">Investor summaries will appear here as deals move through promotion and servicing.</p>
              </article>
            ) : featuredCases.map(({ item, promotion, servicing }) => {
              const firstUpdate = servicing?.updates?.[0];

              return (
                <article key={item.id} className="status-card turicum-investor-matter-card">
                  <div className="section-head compact">
                    <div>
                      <p className="eyebrow">{item.code}</p>
                      <strong>{buildHeadline(item.title, promotion?.headline)}</strong>
                    </div>
                    <span className="badge provisional">{formatLabel(promotion?.status)}</span>
                  </div>
                  <p className="helper">{item.state} · {item.structureType}</p>
                  <ul className="list compact-list turicum-tight-list">
                    <li><strong>Promotion status:</strong> {formatLabel(promotion?.status)}</li>
                    <li><strong>Promotion summary:</strong> {buildPromotionSummary(promotion?.investorSummary)}</li>
                    <li><strong>Final structure:</strong> {formatLabel(promotion?.finalStructure)}</li>
                    <li><strong>Final investors:</strong> {promotion?.finalInvestorCount ?? 0}</li>
                    <li><strong>Lead investor:</strong> {promotion?.leadInvestorName || "Not assigned"}</li>
                    <li><strong>Servicing status:</strong> {formatLabel(servicing?.status)}</li>
                    <li><strong>Distribution summary:</strong> {buildDistributionSummary(servicing?.investorDistributionSummary)}</li>
                    <li><strong>Next update:</strong> {firstUpdate ? `${firstUpdate.periodLabel} · ${firstUpdate.amountSummary}` : "No investor update sequence yet"}</li>
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
