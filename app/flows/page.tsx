import Link from "next/link";
import { TuricumNav } from "@/components/turicum/nav";
import { FlowMap } from "@/components/turicum/flow-map";
import { getTuricumFlowMap } from "@/lib/turicum/flow-map-store";
import { withBasePath } from "@/lib/turicum/runtime";

export const dynamic = "force-dynamic";

export default async function FlowsPage() {
  const flowMap = await getTuricumFlowMap();

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Flows</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Turicum LLC process map.</h1>
              <p>See the deal across the three lanes that actually matter: Borrower, Turicum LLC, and Investor.</p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Mode</p>
                  <strong>Shared</strong>
                  <p className="helper">team edits persist after reload</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Use</p>
                  <strong>Borrower / Turicum LLC / Investor</strong>
                  <p className="helper">three-lane swimlane view</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Print</p>
                  <strong>Handout view</strong>
                  <p className="helper">clean PDF and paper output</p>
                </div>
              </div>
              <div className="form-actions flow-print-links">
                <Link className="secondary-button" href={withBasePath("/flows/print")}>
                  Open print view
                </Link>
                <Link className="secondary-button" href={withBasePath("/flows/print?view=turicum")}>
                  Turicum LLC printout
                </Link>
                <Link className="secondary-button" href={withBasePath("/flows/print?view=investor")}>
Investor printout
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FlowMap initialRecords={flowMap.records} initialEdges={flowMap.edges} />
      </div>
    </main>
  );
}
