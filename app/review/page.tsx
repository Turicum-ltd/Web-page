import type { Metadata } from "next";
import { TuricumReviewOverview } from "@/components/turicum/turicum-review-overview";
import Link from "next/link";
import { withBasePath } from "@/lib/turicum/runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Turicum LLC | Team Hub",
  description: "Protected staff hub for Turicum operations, workflow gates, live blockers, and deployment readiness."
};

export default async function ReviewPage() {
  try {
    return await TuricumReviewOverview();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown review loading error.";

    return (
      <main>
        <div className="shell">
          <section className="hero">
            <p className="eyebrow">Turicum Team Hub</p>
            <div className="hero-grid">
              <div className="hero-copy">
                <h1>Review surface is temporarily unavailable.</h1>
                <p>
                  The internal review page hit a server-side data dependency that still needs cleanup.
                  The page is now failing gracefully so we can see the real issue instead of a digest screen.
                </p>
              </div>
            </div>
          </section>

          <section className="panel subtle">
            <strong>Review load error</strong>
            <p className="helper">{message}</p>
            <div className="form-actions">
              <Link className="secondary-button turicum-primary-button" href={withBasePath("/cases")}>
                Open cases
              </Link>
              <Link className="secondary-button" href={withBasePath("/access")}>
                Open access admin
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }
}
