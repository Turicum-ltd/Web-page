import Link from "next/link";
import { FlowPrintActions } from "@/components/turicum/flow-print-actions";
import { TuricumWordmark } from "@/components/turicum/turicum-wordmark";
import { getTuricumFlowMap, type FlowRecord, type FlowView } from "@/lib/turicum/flow-map-store";
import { withBasePath } from "@/lib/turicum/runtime";

export const dynamic = "force-dynamic";

const flowViews: { id: FlowView; label: string; helper: string }[] = [
  { id: "turicum", label: "Turicum LLC", helper: "Internal underwriting, legal, funding, and control lane" },
  { id: "borrower", label: "Borrower", helper: "External collection and signature lane" },
  { id: "investor", label: "Investor", helper: "Promotion, updates, and exit lane" }
];

type PrintFormat = "packet" | "compact";
type SearchParams = Promise<{ view?: string; format?: string }>;

type DiagramNode = {
  record: FlowRecord;
  x: number;
  y: number;
  column: number;
};

type DiagramEdge = {
  path: string;
  stroke: string;
  label?: string;
  labelX: number;
  labelY: number;
};

function wrapDiagramText(value: string, maxChars: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [] as string[];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  const remainingWords = words.slice(lines.join(" ").split(/\s+/).filter(Boolean).length);
  if (remainingWords.length && lines.length) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex].replace(/[.,;:!?…]+$/, "")}…`;
  }

  return lines.slice(0, maxLines);
}

const STATUS_ACCENT: Record<FlowRecord["status"], { fill: string; stroke: string; badge: string }> = {
  core: { fill: "rgba(18, 33, 53, 0.98)", stroke: "rgba(88, 166, 255, 0.65)", badge: "#9fd0ff" },
  review: { fill: "rgba(31, 33, 53, 0.98)", stroke: "rgba(164, 140, 255, 0.58)", badge: "#d2c3ff" },
  decision: { fill: "rgba(46, 31, 22, 0.98)", stroke: "rgba(255, 183, 95, 0.62)", badge: "#ffd698" },
  external: { fill: "rgba(20, 43, 34, 0.98)", stroke: "rgba(103, 219, 165, 0.56)", badge: "#bcf4d9" }
};

const FLOW_SEQUENCE = [
  "deal-intake",
  "intake-workspace",
  "borrower-portal",
  "borrower-property-validation",
  "investor-promotion",
  "investor-workspace",
  "template-selection",
  "contract-ai-review",
  "legal-review",
  "google-signature",
  "notary-branch",
  "funding",
  "servicing",
  "exit"
] as const;

const flowSequenceIndex = new Map<string, number>(FLOW_SEQUENCE.map((id, index) => [id, index]));

const PRINT_STAGE_ORDER = [
  { key: "origination", label: "Origination", ids: ["deal-intake", "intake-workspace", "borrower-portal"], fill: "rgba(25, 52, 92, 0.34)", stroke: "rgba(88, 166, 255, 0.32)" },
  { key: "validation", label: "Validation", ids: ["borrower-property-validation"], fill: "rgba(58, 55, 102, 0.32)", stroke: "rgba(166, 139, 255, 0.28)" },
  { key: "promotion", label: "Promotion", ids: ["investor-promotion", "investor-workspace"], fill: "rgba(18, 73, 56, 0.32)", stroke: "rgba(103, 219, 165, 0.28)" },
  { key: "legal", label: "Legal", ids: ["template-selection", "contract-ai-review", "legal-review"], fill: "rgba(90, 58, 18, 0.34)", stroke: "rgba(255, 193, 69, 0.3)" },
  { key: "execution", label: "Execution", ids: ["google-signature", "notary-branch", "funding"], fill: "rgba(62, 40, 98, 0.34)", stroke: "rgba(194, 151, 255, 0.3)" },
  { key: "servicing", label: "Servicing", ids: ["servicing"], fill: "rgba(28, 63, 78, 0.32)", stroke: "rgba(94, 234, 212, 0.3)" },
  { key: "exit", label: "Exit", ids: ["exit"], fill: "rgba(90, 36, 36, 0.34)", stroke: "rgba(255, 107, 107, 0.32)" }
] as const;

const PRINT_LANE_ACCENT: Record<string, string> = {
  Turicum: "rgba(88, 166, 255, 0.9)",
  Borrower: "rgba(120, 181, 255, 0.9)",
  Investor: "rgba(103, 219, 165, 0.9)"
};

function displayLaneLabel(lane: string) {
  return lane === "Turicum" ? "Turicum LLC" : lane;
}

function sortRecords(records: FlowRecord[]) {
  return [...records].sort((a, b) => {
    const aIndex = flowSequenceIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = flowSequenceIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex || a.position.x - b.position.x || a.position.y - b.position.y;
  });
}

function filterRecords(records: FlowRecord[], view: FlowView) {
  return sortRecords(records).filter((record) => record.viewTags.includes(view));
}

function normalizeView(input?: string): FlowView | "all" {
  if (!input) return "all";
  return flowViews.some((view) => view.id === input) ? (input as FlowView) : "all";
}

function normalizeFormat(input?: string): PrintFormat {
  return input === "compact" ? "compact" : "packet";
}

function compactPath(view: FlowView | "all", format: PrintFormat) {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  if (format !== "packet") params.set("format", format);
  const query = params.toString();
  return `/flows/print${query ? `?${query}` : ""}`;
}

function buildCompactGroups(records: FlowRecord[]) {
  const groups = new Map<string, FlowRecord[]>();
  for (const record of records) {
    const key = record.lane;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(record);
  }
  return Array.from(groups.entries()).map(([lane, items]) => ({ lane, items: sortRecords(items) }));
}


function edgeLabelForTarget(target: string) {
  if (target === "investor-promotion") return "Promotion ready";
  if (target === "google-signature") return "Signature cleared";
  if (target === "notary-branch") return "Notary required";
  if (target === "servicing") return "Funded";
  if (target === "exit") return "Resolution path";
  return undefined;
}

function buildDiagram(records: FlowRecord[], edges: { source: string; target: string }[]) {
  if (!records.length) {
    return { lanes: [] as string[], nodes: [] as DiagramNode[], edgePaths: [] as DiagramEdge[], stageBands: [] as Array<{ key: string; label: string; fill: string; stroke: string; x: number; width: number }>, width: 1200, height: 360, nodeWidth: 248, nodeHeight: 116, laneGap: 168, topPad: 76 };
  }

  const ordered = sortRecords(records);
  const laneOrder = Array.from(
    new Map(
      ordered
        .slice()
        .sort((a, b) => a.position.y - b.position.y)
        .map((record) => [record.lane, record])
    ).keys()
  );

  const nodeWidth = 248;
  const nodeHeight = 116;
  const leftPad = 88;
  const rightPad = 96;
  const topPad = 76;
  const laneGap = 168;
  const columnGap = 52;
  const width = leftPad + ordered.length * (nodeWidth + columnGap) + rightPad;

  const lanePositions = new Map(laneOrder.map((lane, index) => [lane, topPad + index * laneGap]));
  const nodes = ordered.map((record, index) => ({
    record,
    x: leftPad + index * (nodeWidth + columnGap),
    y: lanePositions.get(record.lane) ?? topPad,
    column: index
  }));
  const nodeById = new Map(nodes.map((node) => [node.record.id, node]));

  const edgePaths = edges
    .map((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      if (!source || !target) return null;
      const sx = source.x + nodeWidth;
      const sy = source.y + nodeHeight / 2;
      const tx = target.x;
      const ty = target.y + nodeHeight / 2;
      const mx = sx + Math.max((tx - sx) * 0.5, 40);
      return {
        path: `M ${sx} ${sy} C ${mx} ${sy}, ${tx - 34} ${ty}, ${tx} ${ty}`,
        stroke: target.record.id === "notary-branch"
          ? "rgba(194, 151, 255, 0.9)"
          : PRINT_LANE_ACCENT[target.record.lane] ?? "rgba(125, 148, 178, 0.9)",
        label: edgeLabelForTarget(target.record.id),
        labelX: (sx + tx) / 2,
        labelY: ((sy + ty) / 2) - 10
      };
    })
    .filter((edge) => Boolean(edge)) as DiagramEdge[];

  const stageBands = PRINT_STAGE_ORDER.map((stage) => {
    const stageNodes = nodes.filter((node) => stage.ids.includes(node.record.id as never));
    if (!stageNodes.length) return null;
    const first = stageNodes[0];
    const last = stageNodes[stageNodes.length - 1];
    return {
      ...stage,
      x: first.x - 16,
      width: (last.x - first.x) + nodeWidth + 32
    };
  }).filter((stage): stage is (typeof PRINT_STAGE_ORDER)[number] & { x: number; width: number } => Boolean(stage));

  const height = topPad + Math.max(laneOrder.length - 1, 0) * laneGap + nodeHeight + 76;

  return { lanes: laneOrder, nodes, edgePaths, stageBands, width, height, nodeWidth, nodeHeight, laneGap, topPad };
}

function PrintableDiagram({
  records,
  edges,
  title,
  helper
}: {
  records: FlowRecord[];
  edges: { source: string; target: string }[];
  title: string;
  helper: string;
}) {
  const diagram = buildDiagram(records, edges);

  return (
    <section className="panel flow-print-panel flow-print-diagram-panel">
      <div className="section-head compact">
        <div>
          <p className="eyebrow">Visual Diagram</p>
          <h2>{title}</h2>
        </div>
        <p className="helper">{helper}</p>
      </div>
      <div className="flow-print-diagram-wrap">
        <svg
          className="flow-print-diagram-svg"
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          role="img"
          aria-label={title}
        >
          <defs>
            <marker id="flow-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(125, 148, 178, 0.9)" />
            </marker>
          </defs>

          {diagram.stageBands.map((stage) => (
            <g key={stage.key}>
              <rect
                x={stage.x}
                y="16"
                width={stage.width}
                height="34"
                rx="12"
                fill={stage.fill}
                stroke={stage.stroke}
                strokeWidth="1"
              />
              <text x={stage.x + 16} y="37" className="flow-print-diagram-stage-label">
                {stage.label}
              </text>
            </g>
          ))}

          {diagram.lanes.map((lane, index) => {
            const y = diagram.topPad + index * diagram.laneGap - 26;
            return (
              <g key={lane}>
                <rect
                  x="18"
                  y={y}
                  width={diagram.width - 36}
                  height="132"
                  rx="18"
                  className="flow-print-diagram-lane"
                />
                <rect
                  x="18"
                  y={y}
                  width="5"
                  height="132"
                  rx="18"
                  fill={PRINT_LANE_ACCENT[lane] ?? "rgba(125, 148, 178, 0.9)"}
                />
                <text x="34" y={y + 24} className="flow-print-diagram-lane-label">
                  {displayLaneLabel(lane)}
                </text>
              </g>
            );
          })}

          {diagram.edgePaths.map((edge, index) => (
            <g key={index}>
              <path d={edge.path} className="flow-print-diagram-edge" stroke={edge.stroke} markerEnd="url(#flow-arrow)" />
              {edge.label ? (
                <g>
                  <rect x={edge.labelX - 40} y={edge.labelY - 12} width="80" height="20" rx="999" fill="rgba(10, 15, 21, 0.92)" stroke={edge.stroke} strokeWidth="1" />
                  <text x={edge.labelX} y={edge.labelY + 2} textAnchor="middle" className="flow-print-diagram-edge-label">
                    {edge.label}
                  </text>
                </g>
              ) : null}
            </g>
          ))}

          {diagram.nodes.map((node, index) => {
            const accent = STATUS_ACCENT[node.record.status];
            const titleLines = wrapDiagramText(node.record.title, 24, 2);
            const actorLines = wrapDiagramText(node.record.actor, 28, 2);
            return (
              <g key={node.record.id} transform={`translate(${node.x}, ${node.y})`}>
                <rect
                  width={diagram.nodeWidth}
                  height={diagram.nodeHeight}
                  rx="16"
                  fill={accent.fill}
                  stroke={accent.stroke}
                  strokeWidth="1.5"
                />
                <text x="18" y="22" className="flow-print-diagram-step-index">
                  Step {index + 1}
                </text>
                <rect x={diagram.nodeWidth - 92} y="12" width="74" height="24" rx="999" fill="rgba(255,255,255,0.06)" />
                <text x={diagram.nodeWidth - 55} y="28" textAnchor="middle" className="flow-print-diagram-status" fill={accent.badge}>
                  {node.record.status}
                </text>
                <text x="18" y="46" className="flow-print-diagram-node-title">
                  {titleLines.map((line, lineIndex) => (
                    <tspan key={line} x="18" dy={lineIndex === 0 ? 0 : 16}>{line}</tspan>
                  ))}
                </text>
                <text x="18" y={titleLines.length > 1 ? 82 : 66} className="flow-print-diagram-node-meta">
                  {actorLines.map((line, lineIndex) => (
                    <tspan key={line} x="18" dy={lineIndex === 0 ? 0 : 14}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

export default async function FlowPrintPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {};
  const selectedView = normalizeView(params.view);
  const format = normalizeFormat(params.format);
  const flowMap = await getTuricumFlowMap();
  const ordered = sortRecords(
    selectedView === "all"
      ? flowMap.records
      : flowMap.records.filter((record) => record.viewTags.includes(selectedView))
  );
  const filteredEdges = flowMap.edges.filter((edge) => ordered.some((record) => record.id === edge.source) && ordered.some((record) => record.id === edge.target));
  const totalGates = ordered.reduce((sum, record) => sum + record.gates.length, 0);
  const decisionSteps = ordered.filter((record) => record.status === "decision").length;
  const externalSteps = ordered.filter((record) => record.status === "external").length;
  const summaryLine =
    selectedView === "all"
      ? "Full Turicum LLC operating flow across Turicum LLC, borrower, and investor lanes."
      : `${flowViews.find((view) => view.id === selectedView)?.label} handout focused on one operating lane.`;
  const compactGroups = buildCompactGroups(ordered);
  const presetLabel = selectedView === "all" ? "All views" : flowViews.find((view) => view.id === selectedView)?.label;
  const diagramTitle = selectedView === "all" ? "Printable operating flow across all Turicum LLC lanes" : `${presetLabel} printable operating flow`;

  return (
    <main className={`flow-print-page${format === "compact" ? " flow-print-page-compact" : ""}`}>
      <div className="shell">
        <section className="hero flow-print-hero">
          <div className="flow-print-brand-row">
            <div className="flow-print-brand-lockup">
              <div className="flow-print-brand-badge">
                <TuricumWordmark showDescriptor={false} />
              </div>
              <div>
                <p className="eyebrow">MarketShift Turicum LLC</p>
                <h1>{format === "compact" ? "Compact flow printout." : "Workflow printout."}</h1>
                <p>{summaryLine}</p>
              </div>
            </div>
            <div className="flow-print-brand-meta">
              <strong>{selectedView === "all" ? "Master packet" : `${presetLabel} packet`}</strong>
              <span>{new Date(flowMap.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <div className="flow-print-summary-card">
                <p className="eyebrow">Executive Summary</p>
                <ul className="turicum-flow-list compact-list">
                  <li>{ordered.length} mapped steps in scope.</li>
                  <li>{totalGates} approval or readiness gates must be cleared.</li>
                  <li>{decisionSteps} decision checkpoints require explicit human judgment.</li>
                  <li>{externalSteps} steps touch borrower or outside execution lanes.</li>
                </ul>
              </div>
              {format === "compact" ? (
                <div className="callout no-print compact-print-hint">
                  <p className="eyebrow">Compact format</p>
                  <p>Best saved as a landscape PDF from the print dialog.</p>
                </div>
              ) : null}
            </div>
            <div className="hero-aside flow-print-hero-aside">
              <FlowPrintActions />
              <div className="dashboard-band compact-grid">
                <div className="band-card">
                  <p className="eyebrow">Steps</p>
                  <strong>{ordered.length}</strong>
                  <p className="helper">total mapped process steps</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Gates</p>
                  <strong>{totalGates}</strong>
                  <p className="helper">approval and readiness checks</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Preset</p>
                  <strong>{presetLabel}</strong>
                  <p className="helper">current print scope</p>
                </div>
              </div>
              <div className="flow-print-preset-row no-print">
                <Link className={`secondary-button${selectedView === "all" ? " active" : ""}`} href={compactPath("all", format)}>All</Link>
                {flowViews.map((view) => (
                  <Link key={view.id} className={`secondary-button${selectedView === view.id ? " active" : ""}`} href={compactPath(view.id, format)}>
                    {view.label}
                  </Link>
                ))}
              </div>
              <div className="flow-print-format-row no-print">
                <Link className={`secondary-button${format === "packet" ? " active" : ""}`} href={compactPath(selectedView, "packet")}>Detailed packet</Link>
                <Link className={`secondary-button${format === "compact" ? " active" : ""}`} href={compactPath(selectedView, "compact")}>Compact diagram</Link>
              </div>
            </div>
          </div>
        </section>

        <PrintableDiagram records={ordered} edges={filteredEdges} title={diagramTitle} helper="Graphical print layout for decks, handouts, and PDF review." />

        {format === "compact" ? (
          <section className="panel flow-print-panel flow-print-compact-panel">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Compact Diagram</p>
                <h2>{selectedView === "all" ? "Landscape summary across all lanes" : `${presetLabel} landscape summary`}</h2>
              </div>
              <Link className="secondary-button no-print" href={withBasePath("/flows")}>Back to interactive map</Link>
            </div>
            <div className="flow-print-compact-grid">
              {compactGroups.map((group) => (
                <section key={group.lane} className="flow-print-lane-column">
                  <div className="flow-print-lane-head">
                    <p className="eyebrow">Lane</p>
                    <h3>{displayLaneLabel(group.lane)}</h3>
                  </div>
                  <div className="flow-print-lane-stack">
                    {group.items.map((record, index) => (
                      <article key={record.id} className="flow-print-compact-card">
                        <div className="flow-print-role-top">
                          <div>
                            <p className="eyebrow">Step {index + 1}</p>
                            <h3>{record.title}</h3>
                          </div>
                          <span className={`turicum-flow-status turicum-flow-status-${record.status}`}>{record.status}</span>
                        </div>
                        <p className="helper">{record.summary}</p>
                        <div className="turicum-flow-meta-row">
                          <span className="turicum-flow-chip">{record.actor}</span>
                          <span className="turicum-flow-chip turicum-flow-chip-muted">{record.phase}</span>
                        </div>
                        <p>{record.goal}</p>
                        {record.gates.length ? (
                          <div className="callout subtle">
                            <p className="eyebrow">Key gates</p>
                            <ul className="turicum-flow-list compact-list">
                              {record.gates.slice(0, 3).map((gate) => (
                                <li key={gate}>{gate}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="panel flow-print-panel">
              <div className="section-head compact">
                <div>
                  <p className="eyebrow">Master Sequence</p>
                  <h2>{selectedView === "all" ? "All Turicum LLC flow steps in operational order" : `${presetLabel} steps in operational order`}</h2>
                </div>
                <Link className="secondary-button no-print" href={withBasePath("/flows")}>Back to interactive map</Link>
              </div>
              <div className="flow-print-sequence">
                {ordered.map((record, index) => (
                  <article key={record.id} className="flow-print-step">
                    <div className="flow-print-step-top">
                      <span className="flow-print-index">{index + 1}</span>
                      <div>
                        <p className="eyebrow">{record.phase}</p>
                        <h3>{record.title}</h3>
                      </div>
                      <span className={`turicum-flow-status turicum-flow-status-${record.status}`}>{record.status}</span>
                    </div>
                    <p className="helper">{record.summary}</p>
                    <div className="turicum-flow-meta-row">
                      <span className="turicum-flow-chip">{record.actor}</span>
                      <span className="turicum-flow-chip turicum-flow-chip-muted">{displayLaneLabel(record.lane)}</span>
                      <span className="turicum-flow-chip turicum-flow-chip-muted">{record.output}</span>
                    </div>
                    <div className="flow-print-detail-grid">
                      <div className="callout">
                        <p className="eyebrow">Goal</p>
                        <p>{record.goal}</p>
                      </div>
                      <div className="callout">
                        <p className="eyebrow">Route</p>
                        <p>{record.href ?? "No direct route yet"}</p>
                      </div>
                    </div>
                    {record.gates.length ? (
                      <div className="callout">
                        <p className="eyebrow">Gates</p>
                        <ul className="turicum-flow-list">
                          {record.gates.map((gate) => (
                            <li key={gate}>{gate}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {record.notes ? (
                      <div className="callout subtle">
                        <p className="eyebrow">Notes</p>
                        <p>{record.notes}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            {selectedView === "all"
              ? flowViews.map((view) => {
                  const records = filterRecords(flowMap.records, view.id);
                  return (
                    <section key={view.id} className="panel flow-print-panel flow-print-role-section">
                      <div className="section-head compact">
                        <div>
                          <p className="eyebrow">{view.label} view</p>
                          <h2>{view.helper}</h2>
                        </div>
                        <strong>{records.length} steps</strong>
                      </div>
                      <div className="flow-print-role-grid">
                        {records.map((record) => (
                          <article key={record.id} className="flow-print-role-card">
                            <div className="flow-print-role-top">
                              <div>
                                <h3>{record.title}</h3>
                                <p className="helper">{record.summary}</p>
                              </div>
                              <span className={`turicum-flow-status turicum-flow-status-${record.status}`}>{record.status}</span>
                            </div>
                            <div className="turicum-flow-meta-row">
                              <span className="turicum-flow-chip">{record.actor}</span>
                              <span className="turicum-flow-chip turicum-flow-chip-muted">{record.phase}</span>
                            </div>
                            <p>{record.goal}</p>
                            {record.gates.length ? (
                              <ul className="turicum-flow-list compact-list">
                                {record.gates.map((gate) => (
                                  <li key={gate}>{gate}</li>
                                ))}
                              </ul>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })
              : null}
          </>
        )}

        <footer className="flow-print-footer">
          <span>MarketShift Turicum LLC</span>
          <span>{selectedView === "all" ? "Full flow packet" : `${presetLabel} flow packet`}</span>
          <span>{format === "compact" ? "Compact diagram format" : "Generated from shared flow map"}</span>
        </footer>
      </div>
    </main>
  );
}
