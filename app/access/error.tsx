"use client";

import Link from "next/link";
import { useEffect } from "react";
import { withBasePath } from "@/lib/turicum/runtime";

export default function AccessErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Turicum access admin route error", error);
  }, [error]);

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Access Admin</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Access admin hit a server-side issue.</h1>
              <p>
                The route failed gracefully so we can retry the action and see the real message
                instead of the generic application digest screen.
              </p>
            </div>
          </div>
        </section>

        <section className="panel subtle">
          <strong>Access route error</strong>
          <p className="helper">{error.message || "Unknown access admin error."}</p>
          {error.digest ? <p className="helper">Digest: {error.digest}</p> : null}
          <div className="form-actions">
            <button type="button" onClick={() => reset()}>
              Retry access admin
            </button>
            <Link className="secondary-button" href={withBasePath("/team-login?next=%2Faccess")}>
              Back to team sign-in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
