export const dynamic = "force-dynamic";

import Link from "next/link";
import { TuricumNav } from "@/components/turicum/nav";
import { withBasePath } from "@/lib/turicum/runtime";
import { listCases } from "@/lib/turicum/cases";
import { getStageLabel, getStatePackByCode, summarizePack } from "@/lib/turicum/state-packs";

export default async function CasesPage() {
  const cases = await listCases();
  const activeStates = Array.from(new Set(cases.map((item) => item.state))).sort();

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Cases</p>
          <div className="hero-grid">
            <div className="panel" style={{ padding: 0, border: "none", boxShadow: "none", background: "transparent" }}>
              <h1>{cases.length === 0 ? "Open the first matter and keep the whole deal in one operating lane." : "Run every matter from one clear case board."}</h1>
              <p>
                {cases.length === 0
                  ? "Start with the core facts, then add validation, borrower intake, Drive documents, and investor access as the file matures."
                  : "Each case ties together the state pack, structure, Drive workspace, borrower flow, and investor-facing status without making the operator jump across tools."}
              </p>
            </div>
            <div className="panel">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Open matters</p>
                  <strong>{cases.length}</strong>
                  <p className="helper">live case rows</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">States</p>
                  <strong>{activeStates.length}</strong>
                  <p className="helper">{activeStates.length > 0 ? activeStates.join(", ") : "ready to start"}</p>
                </div>
              </div>
              <div className="form-actions">
                <Link className="secondary-button" href={withBasePath("/cases/new")}>Open new case</Link>
              </div>
              <ul className="list">
                <li>One case row per real deal or closing matter.</li>
                <li>The first screen should only need the core facts.</li>
                <li>Validation, borrower setup, and documents can be layered in after the matter opens.</li>
              </ul>
            </div>
          </div>
        </section>

        {cases.length === 0 ? (
          <section className="panel lead">
            <p className="eyebrow">Start Here</p>
            <h2>Create the first case in one short pass</h2>
            <p>
              Use the quick-open form to capture the title, state, structure, amount, and property basics.
              Once the case exists, Turicum can handle borrower intake, document linking, and investor access from the case itself.
            </p>
            <div className="dashboard-band">
              <div className="band-card">
                <p className="eyebrow">Step 1</p>
                <strong>Open matter</strong>
                <p className="helper">Capture core borrower and property facts.</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Step 2</p>
                <strong>Set Drive folder</strong>
                <p className="helper">Point Turicum to the live case workspace.</p>
              </div>
              <div className="band-card">
                <p className="eyebrow">Step 3</p>
                <strong>Move the file</strong>
                <p className="helper">Add docs, invite the borrower, and grant investor access.</p>
              </div>
            </div>
            <div className="form-actions">
              <Link className="secondary-button" href={withBasePath("/cases/new")}>Create first case</Link>
            </div>
          </section>
        ) : (
          <section className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>State</th>
                  <th>Structure</th>
                  <th>Stage</th>
                  <th>Requested Amount</th>
                  <th>Packet Readiness</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => {
                  const statePack = getStatePackByCode(item.state);
                  const counts = statePack ? summarizePack(statePack) : null;

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          <Link href={withBasePath(`/cases/${item.id}`)}>{item.code}</Link>
                        </strong>
                        <br />
                        <span className="muted">{item.title}</span>
                      </td>
                      <td>{item.state}</td>
                      <td>{item.structureType}</td>
                      <td>{getStageLabel(item.stage)}</td>
                      <td>{item.requestedAmount}</td>
                      <td>
                        {counts ? `${counts.required} required docs / ${counts.checklistItems} checklist items` : "No pack"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  );
}
