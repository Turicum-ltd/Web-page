export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { listCases } from "@/lib/turicum/cases";
import { getInvestorUserForSessionToken, INVESTOR_SESSION_COOKIE } from "@/lib/turicum/investor-auth";
import { getCaseInvestorPromotion } from "@/lib/turicum/investor-promotion";
import { getCaseServicingRecord } from "@/lib/turicum/lifecycle";
import { withBasePath, withConfiguredBasePath } from "@/lib/turicum/runtime";

export const metadata: Metadata = {
  title: "Turicum Investors | First-Lien Asset-Based Lending",
  description: "Investor access for promoted first-lien asset-based lending opportunities, servicing updates, and resolution status."
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const investorPillars = [
  {
    eyebrow: "Selection",
    title: "Curated promoted matters, not generic volume.",
    description: "Deals appear only after Turicum clears intake, validation, and promotion readiness for the investor lane."
  },
  {
    eyebrow: "Yield",
    title: "10% return structure.",
    description: "The investor lane is built around income discipline, clear reporting, and a defined servicing cadence."
  },
  {
    eyebrow: "Security",
    title: "First-lien collateral stays central.",
    description: "Investors follow payoff, extension, refinance, or rollover direction with first-lien collateral visibility and downside discipline."
  }
];

const portalScope = [
  "Promoted matter summaries once the file is cleared for investors",
  "Servicing posture, reserve notes, and distribution updates after funding",
  "Resolution tracking across payoff, extension, refinance, and rollover"
];

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatLabel(value: string | undefined) {
  return (value ?? "not set").replaceAll("_", " ");
}

function buildHeadline(title: string, promotedHeadline: string | undefined) {
  return promotedHeadline?.trim() || title;
}

function buildPromotionSummary(summary: string | undefined) {
  return summary?.trim() || "Promotion summary will appear once Turicum shares the promoted matter.";
}

function buildDistributionSummary(summary: string | undefined) {
  return summary?.trim() || "Monthly servicing updates will appear after funding starts.";
}

export default async function InvestorsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const token = cookieStore.get(INVESTOR_SESSION_COOKIE)?.value;
  const investorUser = token ? await getInvestorUserForSessionToken(token) : null;
  const heroArt = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80";

  if (!investorUser) {
    const error = readString(params.error);
    const loggedOut = readString(params.logged_out) === "1";

    return (
      <main>
        <div className="shell turicum-investor-shell turicum-public-shell">
          <section className="hero turicum-public-hero turicum-investor-hero">
            <div className="hero-grid turicum-public-hero-grid turicum-investor-hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">Investor Portal</p>
                <div className="hero-brand-lockup">
                  <TuricumWordmark />
                </div>
                <h1>Investor access to promoted first-lien asset-based opportunities.</h1>
                <p>
                  Turicum gives capital partners a dedicated portal for promoted asset-based opportunities with first-lien collateral focus, servicing visibility, and a cleaner read on each deal from promotion through resolution.
                </p>
                <div className="form-actions turicum-inline-actions">
                  <a className="secondary-button turicum-primary-button" href="#signin">Investor login</a>
                  <Link className="secondary-button" href={withBasePath("/investor-handoff")}>Investor materials</Link>
                </div>
              </div>
              <div className="turicum-public-aside turicum-investor-aside">
                <div
                  className="turicum-aside-art turicum-investor-art"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(10, 14, 22, 0.08), rgba(10, 14, 22, 0.58)), url(${heroArt})`
                  }}
                  aria-hidden="true"
                />
                <div className="panel subtle turicum-aside-panel">
                  <p className="eyebrow">Investor lane</p>
                  <ul className="list compact-list turicum-tight-list">
                    {portalScope.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="panel turicum-investor-proof-panel">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Why investors use Turicum</p>
                <h2>Selection, income posture, and collateral clarity before login.</h2>
              </div>
            </div>
            <div className="status-grid turicum-compact-status-grid">
              {investorPillars.map((pillar) => (
                <article key={pillar.title} className="status-card turicum-public-card turicum-nested-card">
                  <p className="eyebrow">{pillar.eyebrow}</p>
                  <strong>{pillar.title}</strong>
                  <p className="helper">{pillar.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="two-up turicum-form-layout">
            <div className="panel turicum-public-card">
              <div className="section-head compact">
                <div>
                  <p className="eyebrow">Portal scope</p>
                  <h2>What investors see, and what stays off the investor screen.</h2>
                </div>
              </div>
              <ul className="list compact-list turicum-tight-list">
                <li><strong>Visible:</strong> promoted matters, servicing posture, reserve notes, and resolution updates.</li>
                <li><strong>Turicum-managed:</strong> underwriting, legal review, diligence, signatures, and funding controls.</li>
                <li><strong>Access:</strong> secure portal login comes after the investor lane and the promoted opportunity are clear.</li>
              </ul>
            </div>

            <div id="signin" className="panel lead turicum-investor-signin-panel">
              <div className="section-head compact">
                <div>
                  <p className="eyebrow">Secure sign-in</p>
                  <h2>Open the investor portal</h2>
                </div>
              </div>
              {error === "invalid" ? (
                <div className="panel subtle">
                  <strong>Sign-in details were not accepted.</strong>
                  <p className="helper">Use the investor credentials issued by Turicum.</p>
                </div>
              ) : null}
              {error === "unavailable" ? (
                <div className="panel subtle">
                  <strong>Investor sign-in is not configured on this deployment yet.</strong>
                  <p className="helper">Set the Turicum investor auth environment variables, then try again.</p>
                </div>
              ) : null}
              {loggedOut ? (
                <div className="panel subtle">
                  <strong>You have been signed out.</strong>
                  <p className="helper">Sign back in any time to continue reviewing promoted matters.</p>
                </div>
              ) : null}
              <form className="form-grid" method="post" action={withConfiguredBasePath("/api/investor-auth/login")}>
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                <label className="field">
                  <span>Password</span>
                  <input name="password" type="password" autoComplete="current-password" required />
                </label>
                <div className="form-actions turicum-inline-actions">
                  <button className="turicum-primary-button" type="submit">Sign in</button>
                  <Link className="secondary-button" href={withBasePath("/investor-handoff")}>Review investor materials</Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const cases = await listCases();
  const featuredCases = await Promise.all(
    cases.slice(0, 6).map(async (item) => ({
      item,
      promotion: await getCaseInvestorPromotion(item.id),
      servicing: await getCaseServicingRecord(item.id)
    }))
  );
  const visibleCases = featuredCases.filter(
    ({ promotion, servicing }) =>
      Boolean(promotion?.status && promotion.status !== "pending") || Boolean(servicing)
  );

  return (
    <main>
      <div className="shell turicum-investor-shell turicum-public-shell">
        <section className="hero turicum-public-hero turicum-investor-hero">
          <div className="hero-grid turicum-public-hero-grid turicum-investor-hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Investor Portal</p>
              <div className="hero-brand-lockup">
                <TuricumWordmark />
              </div>
              <h1>Welcome back, {investorUser.fullName}.</h1>
              <p>
                This secure portal gives you promoted matter visibility, servicing posture, and resolution progress without exposing the internal operating workspace.
              </p>
              <div className="kicker-row">
                <span className="tag">{investorUser.organization}</span>
                <span className="tag">promoted matters</span>
                <span className="tag">servicing updates</span>
              </div>
              <div className="form-actions turicum-inline-actions">
                <Link className="secondary-button" href={withBasePath("/investor-handoff")}>Public investor materials</Link>
                <form method="post" action={withConfiguredBasePath("/api/investor-auth/logout")}>
                  <button type="submit">Sign out</button>
                </form>
              </div>
            </div>
            <div className="hero-aside turicum-review-aside turicum-investor-member-aside">
              <div className="turicum-review-rail turicum-investor-stats">
                <div className="turicum-review-stat">
                  <span>Visible matters</span>
                  <strong>{visibleCases.length}</strong>
                  <small>promotion or servicing active</small>
                </div>
                <div className="turicum-review-stat">
                  <span>Portal email</span>
                  <strong>{investorUser.email}</strong>
                  <small>secure access credential</small>
                </div>
              </div>
              <div className="panel subtle turicum-investor-member-note">
                <p className="eyebrow">Portal scope</p>
                <p className="helper">You are seeing the investor-facing lane only: promoted matters, servicing posture, and resolution visibility.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel turicum-investor-matters-panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Current investor view</p>
              <h2>Promoted matters, servicing visibility, and next update cadence</h2>
            </div>
          </div>
          <div className="status-grid turicum-investor-matters-grid">
            {visibleCases.length === 0 ? (
              <article className="status-card turicum-investor-matter-card">
                <strong>No investor-visible matters yet.</strong>
                <p className="helper">Promoted matters will appear here as Turicum clears validation and shares the investor summary.</p>
              </article>
            ) : (
              visibleCases.map(({ item, promotion, servicing }) => {
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
                      <li><strong>Promotion summary:</strong> {buildPromotionSummary(promotion?.investorSummary)}</li>
                      <li><strong>Final structure:</strong> {formatLabel(promotion?.finalStructure)}</li>
                      <li><strong>Investor count:</strong> {promotion?.finalInvestorCount ?? 0}</li>
                      <li><strong>Servicing:</strong> {formatLabel(servicing?.status)}</li>
                      <li><strong>Distribution:</strong> {buildDistributionSummary(servicing?.investorDistributionSummary)}</li>
                      <li><strong>Next update:</strong> {firstUpdate ? `${firstUpdate.periodLabel} · ${firstUpdate.amountSummary}` : "No update scheduled yet"}</li>
                    </ul>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
