export const dynamic = "force-dynamic";

import Link from "next/link";
import { AtlasNav } from "@/components/atlas/nav";
import { withBasePath } from "@/lib/atlas/runtime";
import { listCases } from "@/lib/atlas/cases";
import { getStageLabel, getStatePackByCode, summarizePack } from "@/lib/atlas/state-packs";

export default async function CasesPage() {
  const cases = await listCases();

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Cases</p>
          <div className="hero-grid">
            <div className="panel" style={{ padding: 0, border: "none", boxShadow: "none", background: "transparent" }}>
              <h1>Starter case board for Turicum LLC operations.</h1>
              <p>
                These sample matters show how cases should bind together state pack, structure
                type, current stage, and packet readiness.
              </p>
            </div>
            <div className="panel">
              <AtlasNav />
              <div className="nav">
                <Link href={withBasePath("/cases/new")}>New case</Link>
              </div>
              <ul className="list">
                <li>One case row per real deal or closing matter.</li>
                <li>Every case selects a state pack version at creation time.</li>
                <li>Document completeness is derived from the selected pack.</li>
              </ul>
            </div>
          </div>
        </section>

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
      </div>
    </main>
  );
}
