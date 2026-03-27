export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { withBasePath, withConfiguredBasePath } from "@/lib/turicum/runtime";

export const metadata: Metadata = {
  title: "Turicum Team | Sign In",
  description: "Internal team sign-in for the protected Turicum workspace."
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/")) {
    return "/review";
  }
  return value;
}

export default async function TeamLoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};
  const nextPath = getNextPath(readString(params.next));
  const error = readString(params.error);
  const loggedOut = readString(params.logged_out) === "1";

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Turicum Team</p>
              <div className="hero-brand-lockup">
                <TuricumWordmark />
              </div>
              <h1>Sign in to the protected Turicum workspace.</h1>
              <p>
                Review, cases, flows, legal controls, diligence, funding, and servicing stay behind
                the team sign-in layer. Borrowers and investors use the public paths instead.
              </p>
              <div className="kicker-row">
                <span className="tag">internal operations</span>
                <span className="tag">review and cases</span>
                <span className="tag">staff only</span>
              </div>
            </div>
            <div className="hero-aside">
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Borrowers</p>
                  <strong>Public path</strong>
                  <p className="helper">review process, then request the first call</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Investors</p>
                  <strong>Portal</strong>
                  <p className="helper">sign in only for investor-safe summaries</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Team</p>
                  <strong>Protected</strong>
                  <p className="helper">review, cases, flows, and controls</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <div className="section-head">
              <div>
                <p className="eyebrow">Sign in</p>
                <h2>Open the internal workspace</h2>
              </div>
            </div>
            {error === "invalid" ? (
              <div className="panel subtle">
                <strong>Sign-in details were not accepted.</strong>
                <p className="helper">Use one of the issued Turicum team email accounts and the shared internal password.</p>
              </div>
            ) : null}
            {loggedOut ? (
              <div className="panel subtle">
                <strong>You have been signed out.</strong>
                <p className="helper">Sign back in to reopen the protected Turicum workspace.</p>
              </div>
            ) : null}
            <form className="form-grid" method="post" action={withConfiguredBasePath("/api/team-auth/login")}>
              <input type="hidden" name="next" value={nextPath} />
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label className="field">
                <span>Password</span>
                <input name="password" type="password" autoComplete="current-password" required />
              </label>
              <div className="form-actions">
                <button type="submit">Sign in</button>
                <Link className="secondary-button" href={withBasePath("/")}>
                  Back to public page
                </Link>
              </div>
            </form>
          </div>

          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Protected surfaces</p>
                <h2>What the team sign-in unlocks</h2>
              </div>
            </div>
            <div className="status-grid">
              <article className="status-card">
                <p className="eyebrow">Review</p>
                <strong>Lifecycle and blockers</strong>
                <p className="helper">Current case posture, gating issues, and readiness live in the review layer.</p>
              </article>
              <article className="status-card">
                <p className="eyebrow">Cases</p>
                <strong>Operational control</strong>
                <p className="helper">Validation, investor promotion, legal, diligence, funding, servicing, and exit stay internal.</p>
              </article>
              <article className="status-card">
                <p className="eyebrow">Library and flows</p>
                <strong>Internal playbooks</strong>
                <p className="helper">Process maps, templates, and state packs are for Turicum staff, not public visitors.</p>
              </article>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
