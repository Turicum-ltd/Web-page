import { notFound } from "next/navigation";
import { AtlasNav } from "@/components/atlas/nav";
import {
  getCategoryLabel,
  getDocumentTypeLabel,
  getStageLabel,
  getStatePackByCode,
  getStructureDocuments,
  summarizePack
} from "@/lib/atlas/state-packs";
import type { StructureType } from "@/lib/atlas/types";

const structures: StructureType[] = ["loan", "purchase"];

export default async function StatePackDetailPage({
  params
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const statePack = getStatePackByCode(state);

  if (!statePack) {
    notFound();
  }

  const counts = summarizePack(statePack);

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">State Pack Detail</p>
          <div className="hero-grid">
            <div className="panel" style={{ padding: 0, border: "none", boxShadow: "none", background: "transparent" }}>
              <h1>
                {statePack.state} {statePack.version}
              </h1>
              <p>{statePack.notes}</p>
            </div>
            <div className="panel">
              <AtlasNav />
              <div className="pill-row">
                <div className="pill">
                  <strong>Support:</strong> {statePack.support_level}
                </div>
                <div className="pill">
                  <strong>Required Docs:</strong> {counts.required}
                </div>
                <div className="pill">
                  <strong>Placeholders:</strong> {counts.placeholders}
                </div>
                <div className="pill">
                  <strong>Checklist:</strong> {counts.checklistItems}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Checklist</p>
              <h2>Shared intake and packet tasks</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Label</th>
                  <th>Stage</th>
                  <th>Structures</th>
                </tr>
              </thead>
              <tbody>
                {statePack.checklist_items.map((item) => (
                  <tr key={`${statePack.state}-${item.code}`}>
                    <td>{item.code}</td>
                    <td>{item.label}</td>
                    <td>{getStageLabel(item.stage)}</td>
                    <td>{item.required_for?.join(", ") ?? "all"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="two-up">
          {structures.map((structureType) => {
            const documents = getStructureDocuments(statePack, structureType);

            return (
              <div className="panel" key={`${statePack.state}-${structureType}`}>
                <div className="section-head">
                  <div>
                    <p className="eyebrow">Structure</p>
                    <h2>{structureType}</h2>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Stage</th>
                        <th>Category</th>
                        <th>Requirement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr
                          key={`${statePack.state}-${structureType}-${document.document_type}`}
                        >
                          <td>{getDocumentTypeLabel(document.document_type)}</td>
                          <td>{getStageLabel(document.stage)}</td>
                          <td>{getCategoryLabel(document.category)}</td>
                          <td>
                            <span className={`badge ${document.requirement_level}`}>
                              {document.requirement_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
