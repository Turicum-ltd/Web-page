"use client";

export function FlowPrintActions() {
  return (
    <div className="flow-print-actions no-print">
      <button type="button" className="secondary-button" onClick={() => window.print()}>
        Print / Save PDF
      </button>
    </div>
  );
}
