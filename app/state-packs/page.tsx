import { AtlasNav } from "@/components/atlas/nav";
import {
  getCategoryLabel,
  getDocumentTypeLabel,
  getStageLabel,
  getStatePacks,
  getStructureDocuments
} from "@/lib/atlas/state-packs";

export default function StatePacksPage() {
  const statePacks = getStatePacks();

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">State Packs</p>
          <div className="hero-grid">
            <div className="panel" style={{ padding: 0, border: "none", boxShadow: "none", background: "transparent" }}>
              <h1>Configured to expand state by state without rewriting the app.</h1>
              <p>
                Each state pack defines supported structures, required documents, placeholders,
                and checklist items. The core Turicum LLC workflow stays the same.
              </p>
            </div>
            <div className="panel">
              <AtlasNav />
              <p>
                This view reads directly from <code>config/state-packs/*.json</code>, so the app
                shape stays aligned with the planning artifacts.
              </p>
            </div>
          </div>
        </section>

        {statePacks.map((statePack) => (
          <section className="panel" key={statePack.state}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{statePack.state}</p>
                <h2>
                  {statePack.state} {statePack.version}
                </h2>
              </div>
              <span className={`badge ${statePack.support_level}`}>{statePack.support_level}</span>
            </div>
            <p>{statePack.notes}</p>

            <div className="two-up">
              {statePack.supported_structures.map((structureType) => {
                const documents = getStructureDocuments(statePack, structureType);

                return (
                  <div className="table-wrap" key={`${statePack.state}-${structureType}`}>
                    <table>
                      <thead>
                        <tr>
                          <th colSpan={4}>{structureType}</th>
                        </tr>
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
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
