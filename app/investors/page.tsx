export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { listCases } from "@/lib/turicum/cases";
import { resolveSupabaseInvestorSessionFromCookies } from "@/lib/turicum/investor-supabase-auth";
import { getCaseInvestorPromotion } from "@/lib/turicum/investor-promotion";
import { getCaseServicingRecord } from "@/lib/turicum/lifecycle";
import { withBasePath, withConfiguredBasePath } from "@/lib/turicum/runtime";

export const metadata: Metadata = {
  title: "Turicum Investors | Boutique Private Credit",
  description: "Investor access for disciplined capital reviewing first-lien, asset-based opportunities, servicing updates, and resolution posture."
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const investorPillars = [
  {
    eyebrow: "Selection discipline",
    title: "Curated opportunities only.",
    description: "Turicum is built around selective promotion rather than broad marketplace volume, keeping the investor lane measured and intentional."
  },
  {
    eyebrow: "First-lien security",
    title: "Asset-backed first-lien security.",
    description: "Collateral position stays central, with investors following the structure through diligence, servicing, and resolution."
  },
  {
    eyebrow: "Servicing cadence",
    title: "Measured servicing visibility.",
    description: "The investor lane is designed for regular reporting, servicing posture visibility, and a cleaner read on income cadence."
  },
  {
    eyebrow: "Resolution posture",
    title: "Resolution transparency.",
    description: "Payoff, extension, refinance, and rollover direction stay visible so investors can track how the file is actually moving."
  }
];

const portalScope = [
  "Promoted matter summaries once the file is cleared for investor review",
  "Servicing posture, reserve notes, and distribution updates after funding",
  "Resolution tracking across payoff, extension, refinance, and rollover"
];

const typicalInvestmentSizeOptions = [
  "$100k-$250k",
  "$250k-$500k",
  "$500k-$1M",
  "$1M-$3M",
  "$3M+"
];

const investorPreviewMetrics = [
  { label: "Income posture", value: "Passive" },
  { label: "Collateral", value: "1st lien" },
  { label: "Reporting", value: "Monthly" }
];

const investorPreviewUpdates = [
  { label: "Deal memo", value: "Mixed-use bridge in Miami with sponsor basis already in." },
  { label: "Servicing cadence", value: "Monthly construction and reserve updates." },
  { label: "Resolution posture", value: "Extension and refinance options tracked from day one." }
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
  const supabaseSession = await resolveSupabaseInvestorSessionFromCookies(await cookies());
  const investorUser = supabaseSession.investor;
  const grantedCaseIds = new Set(supabaseSession.grantedCaseIds);
  const heroArt = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80";

  if (!investorUser) {
    const error = readString(params.error);
    const loggedOut = readString(params.logged_out) === "1";
    const inquirySubmitted = readString(params.inquiry) === "1";
    const inquiryError = readString(params.inquiry_error);

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
                <h1>Investor access for boutique private credit.</h1>
                <p>
                  Turicum gives capital partners a dedicated portal for first-lien, asset-based opportunities with disciplined screening, servicing visibility, and a cleaner read on each deal from promotion through resolution.
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
                <p className="eyebrow">Why Turicum?</p>
                <h2>Selection discipline, first-lien structure, and a cleaner investor lane.</h2>
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

          <section className="panel turicum-investor-preview-panel">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Portal sneak peek</p>
                <h2>A sample investor view, before credentials are issued.</h2>
              </div>
            </div>
            <p className="helper">
              Prospective investors can see the level of clarity first: promoted matter summary,
              servicing posture, and resolution direction. Sensitive values stay blurred until
              access is issued.
            </p>
            <div className="turicum-investor-preview-grid">
              <article className="turicum-investor-preview-window">
                <div className="turicum-investor-preview-head">
                  <div>
                    <p className="eyebrow">Sample promoted case</p>
                    <strong>FL-PUR-702114 · Miami mixed-use bridge</strong>
                  </div>
                  <span className="badge provisional">Sample data</span>
                </div>
                <div className="turicum-investor-preview-metrics turicum-investor-preview-blur">
                  {investorPreviewMetrics.map((item) => (
                    <div key={item.label} className="turicum-investor-preview-metric">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="turicum-investor-preview-card turicum-investor-preview-blur">
                  <p className="eyebrow">Promoted summary</p>
                  <p>
                    Deal recap, collateral position, requested size, and capital stack overview
                    appear here once Turicum clears the file for the investor lane.
                  </p>
                </div>
              </article>

              <article className="turicum-investor-preview-window">
                <div className="turicum-investor-preview-head">
                  <div>
                    <p className="eyebrow">Ongoing visibility</p>
                    <strong>What the portal keeps current</strong>
                  </div>
                  <span className="badge provisional">Sample data</span>
                </div>
                <div className="turicum-investor-preview-list turicum-investor-preview-blur">
                  {investorPreviewUpdates.map((item) => (
                    <div key={item.label} className="turicum-investor-preview-list-item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <p className="helper">
                  This is the level of transparency the investor portal is built to provide once a
                  lead is approved and granted access.
                </p>
              </article>
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

            <div className="turicum-investor-auth-stack">
              <div id="prospective-investor" className="panel turicum-public-card turicum-investor-inquiry-panel">
                <div className="section-head compact">
                  <div>
                    <p className="eyebrow">Prospective investor</p>
                    <h2>Request review before portal access</h2>
                  </div>
                </div>
                <p className="helper">
                  Share your profile and typical check size. Turicum reviews new investor leads
                  before granting secure portal access.
                </p>
                {inquirySubmitted ? (
                  <div className="panel subtle">
                    <strong>Investor inquiry received.</strong>
                    <p className="helper">
                      Turicum has your details and can review fit before issuing full investor
                      portal access.
                    </p>
                  </div>
                ) : null}
                {inquiryError ? (
                  <div className="panel subtle">
                    <strong>We could not submit the inquiry.</strong>
                    <p className="helper">{inquiryError}</p>
                  </div>
                ) : null}
                {!inquirySubmitted ? (
                  <form
                    className="form-grid"
                    method="post"
                    action={withConfiguredBasePath("/api/prospective-investor-inquiries")}
                  >
                    <label className="field">
                      <span>Name</span>
                      <input name="fullName" type="text" required />
                    </label>
                    <label className="field">
                      <span>Email</span>
                      <input name="email" type="email" autoComplete="email" required />
                    </label>
                    <label className="field">
                      <span>LinkedIn Profile</span>
                      <input
                        name="linkedInProfile"
                        type="url"
                        placeholder="Optional"
                      />
                    </label>
                    <label className="field">
                      <span>Typical Investment Size</span>
                      <select name="typicalInvestmentSize" defaultValue="" required>
                        <option value="" disabled>
                          Select a range
                        </option>
                        {typicalInvestmentSizeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-actions turicum-inline-actions">
                      <button className="turicum-primary-button" type="submit">Request review</button>
                    </div>
                  </form>
                ) : null}
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
                    <p className="helper">Use the investor account issued by Turicum for this portal.</p>
                  </div>
                ) : null}
                {error === "unavailable" ? (
                  <div className="panel subtle">
                    <strong>Investor sign-in is not configured on this deployment yet.</strong>
                    <p className="helper">Configure Supabase investor auth for this deployment so issued investor accounts can sign in.</p>
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
    ({ item, promotion, servicing }) =>
      (supabaseSession.investor ? grantedCaseIds.has(item.id) : true) &&
      (Boolean(promotion?.status && promotion.status !== "pending") || Boolean(servicing))
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
