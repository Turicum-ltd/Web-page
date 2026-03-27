"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import type { FlowRecord, FlowStatus, FlowView } from "@/lib/turicum/flow-map-store";
import { withBasePath, withConfiguredBasePath } from "@/lib/turicum/runtime";

const flowViews: { id: FlowView; label: string; helper: string }[] = [
  { id: "all", label: "All", helper: "Full Turicum LLC process" },
  { id: "turicum", label: "Turicum LLC", helper: "Underwriting, legal, funding, and control" },
  { id: "borrower", label: "Borrower", helper: "External collection and signature lane" },
  { id: "investor", label: "Investor", helper: "Promotion, updates, and exit lane" }
];

const laneOrder = ["Turicum", "Borrower", "Investor"] as const;
const laneMeta = {
  Turicum: { helper: "Control, validation, legal, funding", tone: "turicum" },
  Borrower: { helper: "Packet, documents, signature", tone: "borrower" },
  Investor: { helper: "Promotion, commitments, updates", tone: "investor" }
} as const;

const stageOrder = [
  { key: "origination", label: "Origination", helper: "Open the matter and collect the packet", tone: "origination", x: 52, width: 222, ids: ["deal-intake", "intake-workspace", "borrower-portal"] },
  { key: "validation", label: "Validation", helper: "Confirm borrower, property, and risk", tone: "validation", x: 304, width: 218, ids: ["borrower-property-validation"] },
  { key: "promotion", label: "Promotion", helper: "Package the deal and lock investor structure", tone: "promotion", x: 556, width: 238, ids: ["investor-promotion", "investor-workspace"] },
  { key: "legal", label: "Legal", helper: "Choose paper, clear legal review, and finish diligence", tone: "legal", x: 828, width: 250, ids: ["template-selection", "contract-ai-review", "legal-review", "closing-diligence"] },
  { key: "execution", label: "Execution", helper: "Sign, route notary if needed, then fund", tone: "execution", x: 1114, width: 246, ids: ["google-signature", "notary-branch", "funding"] },
  { key: "servicing", label: "Servicing", helper: "Operate the deal after close", tone: "servicing", x: 1400, width: 214, ids: ["servicing"] },
  { key: "exit", label: "Exit", helper: "Resolve the asset and investor outcome", tone: "exit", x: 1642, width: 198, ids: ["exit"] }
] as const;

type LaneName = (typeof laneOrder)[number];
type StageMeta = (typeof stageOrder)[number];

const stageMetaById = new Map<string, StageMeta>();
for (const stage of stageOrder) {
  for (const id of stage.ids) stageMetaById.set(id, stage);
}

const canonicalLaneById = new Map<string, LaneName>([
  ["deal-intake", "Turicum"],
  ["intake-workspace", "Borrower"],
  ["borrower-portal", "Borrower"],
  ["borrower-property-validation", "Turicum"],
  ["investor-promotion", "Investor"],
  ["investor-workspace", "Investor"],
  ["template-selection", "Turicum"],
  ["contract-ai-review", "Turicum"],
  ["legal-review", "Turicum"],
  ["closing-diligence", "Turicum"],
  ["google-signature", "Borrower"],
  ["notary-branch", "Borrower"],
  ["funding", "Turicum"],
  ["servicing", "Investor"],
  ["exit", "Investor"]
]);

const overviewPositionById: Record<string, { x: number; y: number }> = {
  "deal-intake": { x: 68, y: 150 },
  "intake-workspace": { x: 68, y: 312 },
  "borrower-portal": { x: 68, y: 474 },
  "borrower-property-validation": { x: 330, y: 150 },
  "investor-promotion": { x: 586, y: 312 },
  "investor-workspace": { x: 586, y: 474 },
  "template-selection": { x: 856, y: 94 },
  "contract-ai-review": { x: 856, y: 258 },
  "legal-review": { x: 856, y: 422 },
  "closing-diligence": { x: 856, y: 586 },
  "google-signature": { x: 1142, y: 190 },
  "notary-branch": { x: 1142, y: 382 },
  funding: { x: 1142, y: 574 },
  servicing: { x: 1428, y: 286 },
  exit: { x: 1664, y: 286 }
};

function canonicalLane(record: FlowRecord): LaneName {
  const fallbackLane = canonicalLaneById.get(record.id);
  if (fallbackLane) return fallbackLane;
  if (laneOrder.includes(record.lane as LaneName)) return record.lane as LaneName;
  if (record.viewTags.includes("borrower") && !record.viewTags.includes("investor")) return "Borrower";
  if (record.viewTags.includes("investor") && !record.viewTags.includes("borrower")) return "Investor";
  return "Turicum";
}

function nodeClassForStatus(status: FlowStatus, muted: boolean) {
  return `turicum-flow-node turicum-flow-node-${status}${muted ? " turicum-flow-node-muted" : ""}`;
}

function displayLane(lane: LaneName | string) {
  return lane === "Turicum" ? "Turicum LLC" : lane;
}

function sortRecords(records: FlowRecord[]) {
  return [...records].sort((a, b) => {
    const aX = overviewPositionById[a.id]?.x ?? Number.MAX_SAFE_INTEGER;
    const bX = overviewPositionById[b.id]?.x ?? Number.MAX_SAFE_INTEGER;
    const aY = overviewPositionById[a.id]?.y ?? Number.MAX_SAFE_INTEGER;
    const bY = overviewPositionById[b.id]?.y ?? Number.MAX_SAFE_INTEGER;
    return aX - bX || aY - bY;
  });
}

function buildNodes(records: FlowRecord[], activeView: FlowView, presentationMode: boolean): Node[] {
  return sortRecords(records).map((record, index) => {
    const lane = canonicalLane(record);
    const stage = stageMetaById.get(record.id);
    const muted = activeView !== "all" && !record.viewTags.includes(activeView);

    return {
      id: record.id,
      position: overviewPositionById[record.id] ?? { x: stage?.x ?? 80, y: 150 },
      data: {
        label: (
          <div className={`turicum-flow-card turicum-flow-card-compact turicum-flow-card-${lane.toLowerCase()}${presentationMode ? " turicum-flow-card-presentation" : ""}`}>
            <div className="turicum-flow-card-top turicum-flow-card-top-tight">
              <span className="turicum-flow-step-index">Step {index + 1}</span>
              {!presentationMode ? <span className={`turicum-flow-status turicum-flow-status-${record.status}`}>{record.status}</span> : null}
            </div>
            <strong>{record.title}</strong>
            <p>{record.summary}</p>
            <div className="turicum-flow-meta-row">
              <span className="turicum-flow-chip turicum-flow-chip-stage">{stage?.label ?? "Flow"}</span>
              <span className={`turicum-flow-chip turicum-flow-chip-lane turicum-flow-chip-lane-${lane.toLowerCase()}`}>{displayLane(lane)}</span>
              {!presentationMode ? <span className="turicum-flow-chip turicum-flow-chip-muted">{record.phase}</span> : null}
            </div>
          </div>
        )
      },
      style: { width: presentationMode ? 236 : 220 },
      className: nodeClassForStatus(record.status, muted),
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
      selectable: true
    };
  });
}

function edgeLabelForTarget(target: string) {
  if (target === "investor-promotion") return "Promotion ready";
  if (target === "closing-diligence") return "Diligence check";
  if (target === "google-signature") return "Signature cleared";
  if (target === "notary-branch") return "Notary required";
  if (target === "funding") return "Ready to fund";
  if (target === "servicing") return "Funded";
  if (target === "exit") return "Resolution path";
  return undefined;
}

function buildEdges(edges: Edge[], visibleIds: Set<string>) {
  return edges
    .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
    .map((edge) => {
      const targetLane = canonicalLaneById.get(edge.target) ?? canonicalLaneById.get(edge.source) ?? "Turicum";
      const isNotary = edge.target === "notary-branch";
      const isInvestorPath = edge.target === "investor-promotion" || edge.target === "investor-workspace" || edge.target === "servicing" || edge.target === "exit";
      const isBorrowerPath = targetLane === "Borrower";
      const style = isNotary
        ? { stroke: "rgba(194, 151, 255, 0.9)", strokeWidth: 2.5, strokeDasharray: "7 5" }
        : isInvestorPath
          ? { stroke: "rgba(103, 219, 165, 0.88)", strokeWidth: 2.4, strokeDasharray: "2 0" }
          : isBorrowerPath
            ? { stroke: "rgba(88, 166, 255, 0.78)", strokeWidth: 2.15, strokeDasharray: "5 4" }
            : { stroke: "rgba(88, 166, 255, 0.45)", strokeWidth: 1.8, strokeDasharray: "2 0" };
      return {
        ...edge,
        type: "smoothstep",
        animated: false,
        style,
        label: edgeLabelForTarget(edge.target),
        labelShowBg: true,
        labelBgPadding: [10, 5],
        labelBgBorderRadius: 999,
        labelBgStyle: {
          fill: isNotary ? "rgba(57, 41, 87, 0.95)" : isInvestorPath ? "rgba(18, 54, 42, 0.95)" : isBorrowerPath ? "rgba(16, 36, 68, 0.95)" : "rgba(17, 23, 31, 0.95)",
          stroke: style.stroke,
          strokeWidth: 1
        },
        labelStyle: {
          fill: "#e6edf3",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase"
        },
        markerEnd: isNotary
          ? { type: "arrowclosed", color: "rgba(194, 151, 255, 0.9)" }
          : isInvestorPath
            ? { type: "arrowclosed", color: "rgba(103, 219, 165, 0.88)" }
            : { type: "arrowclosed", color: style.stroke }
      } satisfies Edge;
    });
}

export function FlowMap({
  initialRecords,
  initialEdges
}: {
  initialRecords: FlowRecord[];
  initialEdges: Edge[];
}) {
  const [records, setRecords] = useState<FlowRecord[]>(initialRecords);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeView, setActiveView] = useState<FlowView>("all");
  const [presentationMode, setPresentationMode] = useState(false);
  const [query, setQuery] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");


  useEffect(() => {
    setRecords(initialRecords);
    setSelectedId("");
  }, [initialRecords]);

   useEffect(() => {
    if (presentationMode) return;
    const timeout = window.setTimeout(async () => {
      setSaveState("saving");
      try {
        const response = await fetch(withConfiguredBasePath("/api/flows"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records, edges: initialEdges })
        });
        if (!response.ok) throw new Error(`Save failed with status ${response.status}`);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [presentationMode, records, initialEdges]);

  useEffect(() => {
    if (!presentationMode) return;
    setSelectedId("");
    setActiveView("all");
    setQuery("");
  }, [presentationMode]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? null,
    [records, selectedId]
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortRecords(records).filter((record) => {
      const viewMatch = activeView === "all" || record.viewTags.includes(activeView);
      const queryMatch =
        !normalizedQuery ||
        [record.title, record.summary, record.actor, record.phase, canonicalLane(record), stageMetaById.get(record.id)?.label ?? "", ...record.gates]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return viewMatch && queryMatch;
    });
  }, [activeView, query, records]);

  const visibleRecordIds = useMemo(() => new Set(filteredRecords.map((record) => record.id)), [filteredRecords]);
  const edges = useMemo(() => buildEdges(initialEdges, visibleRecordIds), [initialEdges, visibleRecordIds]);
  const nodes = useMemo(() => buildNodes(filteredRecords, activeView, presentationMode), [filteredRecords, activeView, presentationMode]);

  const downstreamRecords = useMemo(() => {
    if (!selectedRecord) return [];
    const targets = new Set(initialEdges.filter((edge) => edge.source === selectedRecord.id).map((edge) => edge.target));
    return sortRecords(records).filter((record) => targets.has(record.id));
  }, [initialEdges, records, selectedRecord]);

  const activeGateCount = useMemo(() => filteredRecords.reduce((sum, record) => sum + record.gates.length, 0), [filteredRecords]);
  const visibleStages = useMemo(() => stageOrder.filter((stage) => filteredRecords.some((record) => stage.ids.includes(record.id as never))), [filteredRecords]);
  const stageSummaries = useMemo(() => visibleStages.map((stage) => {
    const stageRecords = filteredRecords.filter((record) => stage.ids.includes(record.id as never));
    const stageGateCount = stageRecords.reduce((sum, record) => sum + record.gates.length, 0);
    const reviewCount = stageRecords.filter((record) => record.status === "review" || record.status === "decision").length;
    return {
      key: stage.key,
      steps: stageRecords.length,
      gates: stageGateCount,
      reviewCount
    };
  }), [filteredRecords, visibleStages]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (presentationMode) return;
    setSelectedId(node.id);
  }, [presentationMode]);

  const updateSelectedRecord = useCallback((patch: Partial<FlowRecord>) => {
    if (!selectedRecord) return;
    setRecords((current) => current.map((record) => (record.id === selectedRecord.id ? { ...record, ...patch } : record)));
  }, [selectedRecord]);

  const updateSelectedGates = useCallback((value: string) => {
    updateSelectedRecord({ gates: value.split("\n").map((item) => item.trim()).filter(Boolean) });
  }, [updateSelectedRecord]);

  const resetLayout = useCallback(() => {
    setRecords(initialRecords);
    setSelectedId("");
  }, [initialRecords]);

  const selectRecord = useCallback((recordId: string) => {
    setSelectedId(recordId);
  }, []);

  const closeInspector = useCallback(() => {
    setSelectedId("");
  }, []);

  const openOverviewView = useCallback(() => {
    setSelectedId("");
    setRecords(initialRecords);
  }, [initialRecords]);

  return (
    <section className={`panel turicum-flow-shell${presentationMode ? " turicum-flow-shell-presentation" : ""}`}>
      <div className="section-head turicum-flow-topbar">
        <div>
          <p className="eyebrow">Flow Map</p>
          <h2>{presentationMode ? "Turicum LLC operating overview" : "See the process by role, stage, and decision point"}</h2>
          <p className="helper turicum-flow-topbar-copy">
            {presentationMode
              ? "A cleaner executive view of the full Turicum LLC deal lifecycle."
              : "Switch between role lenses, inspect a step, and keep the shared operating map current."}
          </p>
        </div>
        <div className="form-actions">
          <div className="turicum-flow-mode-toggle" role="tablist" aria-label="Flow modes">
            <button type="button" className={`secondary-button${!presentationMode ? " active" : ""}`} onClick={() => setPresentationMode(false)}>Workbench</button>
            <button type="button" className={`secondary-button${presentationMode ? " active" : ""}`} onClick={() => setPresentationMode(true)}>Presentation</button>
          </div>
          {!presentationMode ? <button type="button" className="secondary-button" onClick={resetLayout}>Use overview layout</button> : null}
          {!presentationMode ? (
            <span className={`badge ${saveState === "error" ? "draft" : saveState === "saved" ? "production" : "optional"}`}>
              {saveState === "saving" ? "saving" : saveState === "saved" ? "saved" : saveState === "error" ? "save error" : "shared"}
            </span>
          ) : null}
          {!presentationMode && selectedRecord?.href ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (selectedRecord?.href) {
                  window.location.assign(withConfiguredBasePath(selectedRecord.href));
                }
              }}
            >
              Open selected step
            </button>
          ) : null}
        </div>
      </div>

      {!presentationMode ? (
        <>
          <div className="turicum-flow-summary-band">
            <div className="band-card">
              <p className="eyebrow">Visible steps</p>
              <strong>{filteredRecords.length}</strong>
              <p className="helper">filtered by role and search</p>
            </div>
            <div className="band-card">
              <p className="eyebrow">Active gates</p>
              <strong>{activeGateCount}</strong>
              <p className="helper">approval or readiness checks</p>
            </div>
            <div className="band-card">
              <p className="eyebrow">Current lens</p>
              <strong>{flowViews.find((view) => view.id === activeView)?.label}</strong>
              <p className="helper">{flowViews.find((view) => view.id === activeView)?.helper}</p>
            </div>
          </div>

          <div className="turicum-flow-toolbar">
            <div className="turicum-flow-view-tabs" role="tablist" aria-label="Flow views">
              {flowViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  className={`turicum-flow-view-tab${activeView === view.id ? " turicum-flow-view-tab-active" : ""}`}
                  onClick={() => setActiveView(view.id)}
                >
                  <strong>{view.label}</strong>
                  <span>{view.helper}</span>
                </button>
              ))}
            </div>

            <label className="field turicum-flow-search">
              <span>Search steps</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Stage, actor, gate, or step" />
            </label>
          </div>
        </>
      ) : null}

      <div className={`turicum-flow-layout${selectedRecord && !presentationMode ? " turicum-flow-layout-with-inspector" : ""}`}>
        <div className="turicum-flow-canvas-wrap">
          {presentationMode ? (
            <div className="turicum-flow-overview-rail" aria-hidden="true">
              {visibleStages.map((stage, index) => {
                const summary = stageSummaries.find((item) => item.key === stage.key);
                return (
                  <div key={stage.key} className={`turicum-flow-overview-stage-card turicum-flow-overview-stage-card-${stage.tone}`}>
                    <div className="turicum-flow-overview-stage-top">
                      <span className="turicum-flow-overview-stage-index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="turicum-flow-overview-stage-badge">{summary?.steps ?? 0} steps</span>
                    </div>
                    <strong>{stage.label}</strong>
                    <span>{stage.helper}</span>
                    <div className="turicum-flow-overview-stage-meta">
                      <span>{summary?.gates ?? 0} gates</span>
                      <span>{summary?.reviewCount ?? 0} review points</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="turicum-flow-canvas">
            <div className="turicum-flow-stages" aria-hidden="true">
              {visibleStages.map((stage, index) => (
                <div key={stage.key} className={`turicum-flow-stage turicum-flow-stage-${stage.tone}`} style={{ left: stage.x, width: stage.width }}>
                  <span className="turicum-flow-stage-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="turicum-flow-stage-label">{stage.label}</span>
                  <span className="turicum-flow-stage-helper">{stage.helper}</span>
                </div>
              ))}
            </div>
            <div className="turicum-flow-swimlanes" aria-hidden="true">
              {laneOrder.map((lane) => (
                <div key={lane} className={`turicum-flow-swimlane turicum-flow-swimlane-${lane.toLowerCase()}`}>
                  <span className="turicum-flow-swimlane-label">{lane}</span>
                  <span className="turicum-flow-swimlane-helper">{laneMeta[lane].helper}</span>
                </div>
              ))}
            </div>
            <ReactFlow
              key={presentationMode ? "presentation" : `workbench-`}
              defaultViewport={{ x: 0, y: -6, zoom: presentationMode ? 0.67 : activeView === "all" ? 0.61 : 0.82 }}
              fitView={false}
              minZoom={0.48}
              maxZoom={1.15}
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              onPaneClick={closeInspector}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={!presentationMode}
              panOnDrag
              colorMode="dark"
              defaultEdgeOptions={{ type: "smoothstep", animated: false }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#26303a" gap={22} />
              {!presentationMode ? (
                <Controls showInteractive={false} showFitView={false}>
                  <ControlButton onClick={openOverviewView} title="Full page view" aria-label="Full page view">
                    ⤢
                  </ControlButton>
                </Controls>
              ) : null}
              {!presentationMode ? <MiniMap pannable zoomable nodeStrokeColor="#58a6ff" nodeColor="#121822" maskColor="rgba(10,14,20,0.68)" /> : null}
              <Panel position="top-left" className="turicum-flow-legend turicum-flow-legend-strong">
                <span className="tag">Read left to right</span>
                <span className="tag">Borrower • Turicum LLC • Investor</span>
                <span className="tag">{presentationMode ? "Overview mode" : "Select a step for detail"}</span>
              </Panel>
            </ReactFlow>
          </div>

          {!presentationMode ? (
            <div className="turicum-flow-register">
              <div className="section-head compact">
                <div>
                  <p className="eyebrow">Step Register</p>
                  <h3>Readable list for planning meetings</h3>
                </div>
              </div>
              <div className="turicum-flow-register-list">
                {filteredRecords.map((record, index) => (
                  <button key={record.id} type="button" className={`turicum-flow-register-item${selectedRecord?.id === record.id ? " turicum-flow-register-item-active" : ""}`} onClick={() => selectRecord(record.id)}>
                    <div className="turicum-flow-register-top">
                      <span className="turicum-flow-register-index">{index + 1}</span>
                      <strong>{record.title}</strong>
                      <span className={`turicum-flow-status turicum-flow-status-${record.status}`}>{record.status}</span>
                    </div>
                    <p>{record.summary}</p>
                    <div className="turicum-flow-meta-row">
                      <span className="turicum-flow-chip turicum-flow-chip-stage">{stageMetaById.get(record.id)?.label ?? "Flow"}</span>
                      <span className={`turicum-flow-chip turicum-flow-chip-lane turicum-flow-chip-lane-${canonicalLane(record).toLowerCase()}`}>{canonicalLane(record)}</span>
                      <span className="turicum-flow-chip turicum-flow-chip-muted">{record.phase}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {selectedRecord && !presentationMode ? (
          <aside className="turicum-flow-inspector">
            <div className="subpanel turicum-flow-inspector-panel">
              <div className="stack-sm">
                <p className="eyebrow">Selected step</p>
                <h3>{selectedRecord.title}</h3>
                <div className="turicum-flow-meta-row">
                  <span className="turicum-flow-chip turicum-flow-chip-stage">{stageMetaById.get(selectedRecord.id)?.label ?? "Flow"}</span>
                  <span className={`turicum-flow-chip turicum-flow-chip-lane turicum-flow-chip-lane-${canonicalLane(selectedRecord).toLowerCase()}`}>{canonicalLane(selectedRecord)}</span>
                  <span className="turicum-flow-chip turicum-flow-chip-muted">{selectedRecord.phase}</span>
                  <span className={`turicum-flow-status turicum-flow-status-${selectedRecord.status}`}>{selectedRecord.status}</span>
                </div>
              </div>

              <div className="turicum-flow-detail-grid">
                <div className="callout">
                  <p className="eyebrow">Goal</p>
                  <p>{selectedRecord.goal}</p>
                </div>
                <div className="callout">
                  <p className="eyebrow">Output</p>
                  <p>{selectedRecord.output}</p>
                </div>
              </div>

              <label className="field">
                <span>Summary</span>
                <textarea rows={4} value={selectedRecord.summary} onChange={(event) => updateSelectedRecord({ summary: event.target.value })} />
              </label>

              <label className="field">
                <span>Status</span>
                <select value={selectedRecord.status} onChange={(event) => updateSelectedRecord({ status: event.target.value as FlowStatus })}>
                  <option value="core">core</option>
                  <option value="review">review</option>
                  <option value="decision">decision</option>
                  <option value="external">external</option>
                </select>
              </label>

              <label className="field">
                <span>Goal</span>
                <textarea rows={4} value={selectedRecord.goal} onChange={(event) => updateSelectedRecord({ goal: event.target.value })} />
              </label>

              <label className="field">
                <span>Output</span>
                <input value={selectedRecord.output} onChange={(event) => updateSelectedRecord({ output: event.target.value })} />
              </label>

              <label className="field">
                <span>Gates</span>
                <textarea rows={5} value={selectedRecord.gates.join("\n")} onChange={(event) => updateSelectedGates(event.target.value)} />
              </label>

              {selectedRecord.gates.length ? (
                <div className="callout">
                  <p className="eyebrow">Current gates</p>
                  <ul className="turicum-flow-list">
                    {selectedRecord.gates.map((gate) => (
                      <li key={gate}>{gate}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <label className="field">
                <span>Notes</span>
                <textarea rows={8} value={selectedRecord.notes} onChange={(event) => updateSelectedRecord({ notes: event.target.value })} />
              </label>

              {downstreamRecords.length ? (
                <div className="callout">
                  <p className="eyebrow">Downstream steps</p>
                  <div className="turicum-flow-related-grid">
                    {downstreamRecords.map((record) => (
                      <button key={record.id} type="button" className="turicum-flow-related-card" onClick={() => selectRecord(record.id)}>
                        <strong>{record.title}</strong>
                        <p>{record.summary}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedRecord.href ? (
                <div className="callout">
                  <p className="eyebrow">Linked route</p>
                  <p>{selectedRecord.href}</p>
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
