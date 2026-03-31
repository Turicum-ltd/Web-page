"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/turicum/runtime";

interface AllocationExample {
  id: string;
  assetClass: string;
  region: string;
  ltv: number;
  projectedYield: number;
  status: "Active" | "Fully Funded";
  defaultAllocation: number;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const allocationExamples: AllocationExample[] = [
  {
    id: "infill-industrial-southeast",
    assetClass: "Infill Industrial",
    region: "Southeast US",
    ltv: 65,
    projectedYield: 10.5,
    status: "Active",
    defaultAllocation: 100000
  },
  {
    id: "workforce-multifamily-midatlantic",
    assetClass: "Workforce Multifamily",
    region: "Mid-Atlantic",
    ltv: 62,
    projectedYield: 10.2,
    status: "Active",
    defaultAllocation: 75000
  },
  {
    id: "self-storage-southwest",
    assetClass: "Self-Storage",
    region: "Southwest US",
    ltv: 68,
    projectedYield: 11.0,
    status: "Fully Funded",
    defaultAllocation: 125000
  }
];

const allocationBounds = {
  min: 25000,
  max: 250000,
  step: 25000
};

function calculateMonthlyIncome(allocation: number, projectedYield: number) {
  return Math.round((allocation * (projectedYield / 100)) / 12);
}

function InvestorAccessModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="turicum-underwriting-modal-backdrop" onClick={onClose}>
      <div
        className="turicum-underwriting-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="turicum-underwriting-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="turicum-underwriting-modal-head">
          <div>
            <p className="eyebrow">Investor Login / Sign-up</p>
            <h3 id="turicum-underwriting-modal-title">Access the underwriting room.</h3>
            <p className="helper">
              Live property files, underwriting memoranda, and current allocation status stay inside
              the secure investor portal.
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="turicum-underwriting-modal-grid">
          <article className="turicum-underwriting-modal-card">
            <p className="eyebrow">Existing investors</p>
            <h4>Enter the secure portal.</h4>
            <p className="helper">
              Review live promoted opportunities, allocation status, and monthly servicing updates.
            </p>
            <Link className="secondary-button turicum-primary-button" href={withBasePath("/investors#signin")} onClick={onClose}>
              Investor Login
            </Link>
          </article>

          <article className="turicum-underwriting-modal-card">
            <p className="eyebrow">Prospective partners</p>
            <h4>Request access credentials.</h4>
            <p className="helper">
              Share your profile and check size so Turicum can review fit before opening the room.
            </p>
            <Link className="secondary-button" href={withBasePath("/investors#prospective-investor")} onClick={onClose}>
              Sign Up for Access
            </Link>
          </article>
        </div>
      </div>
    </div>
  );
}

export function LiveOpportunitiesGallery() {
  const [selectedExampleId, setSelectedExampleId] = useState(allocationExamples[0]?.id ?? "");
  const [allocation, setAllocation] = useState(allocationExamples[0]?.defaultAllocation ?? allocationBounds.min);
  const [isInvestorAccessOpen, setIsInvestorAccessOpen] = useState(false);

  const selectedExample =
    allocationExamples.find((example) => example.id === selectedExampleId) ?? allocationExamples[0];

  useEffect(() => {
    if (!selectedExample) {
      return;
    }

    setAllocation(selectedExample.defaultAllocation);
  }, [selectedExample]);

  if (!selectedExample) {
    return null;
  }

  const monthlyIncome = calculateMonthlyIncome(allocation, selectedExample.projectedYield);

  return (
    <>
      <section id="current-opportunities" className="turicum-live-opportunities-section">
        <div className="turicum-section-intro compact">
          <p className="eyebrow">Yield Terminal</p>
          <h2>Active Allocation Table</h2>
          <p>
            Public teaser data now stays abstracted. Asset class, region, leverage, and status are
            visible here, while live property files remain inside the underwriting room.
          </p>
        </div>

        <div className="turicum-yield-terminal">
          <div className="turicum-yield-terminal-head">
            <div>
              <p className="eyebrow">Example only</p>
              <p className="turicum-yield-terminal-note">
                Representative allocation rows shown for institutional preview only. Specific assets,
                addresses, and live underwriting detail require authentication.
              </p>
            </div>
            <button
              type="button"
              className="secondary-button turicum-primary-button"
              onClick={() => setIsInvestorAccessOpen(true)}
            >
              Access Underwriting Room
            </button>
          </div>

          <div className="turicum-allocation-table-shell">
            <table className="turicum-allocation-table">
              <thead>
                <tr>
                  <th>Asset Class</th>
                  <th>Region</th>
                  <th>LTV (%)</th>
                  <th>Projected Yield (%)</th>
                  <th>Status</th>
                  <th aria-label="Underwriting room access" />
                </tr>
              </thead>
              <tbody>
                {allocationExamples.map((example) => {
                  const isSelected = example.id === selectedExample.id;

                  return (
                    <tr
                      key={example.id}
                      className={isSelected ? "is-selected" : undefined}
                      onClick={() => setSelectedExampleId(example.id)}
                    >
                      <td>{example.assetClass}</td>
                      <td>{example.region}</td>
                      <td className="turicum-terminal-mono">{percentFormatter.format(example.ltv)}%</td>
                      <td className="turicum-terminal-mono">{percentFormatter.format(example.projectedYield)}%</td>
                      <td>
                        <span
                          className={`turicum-allocation-status${
                            example.status === "Active" ? " is-active" : " is-funded"
                          }`}
                        >
                          {example.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="turicum-allocation-action"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedExampleId(example.id);
                            setIsInvestorAccessOpen(true);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="turicum-allocation-modeler">
          <div className="turicum-allocation-modeler-head">
            <div>
              <p className="eyebrow">Allocation Modeling Tool (Example)</p>
              <h3>{selectedExample.assetClass} | {selectedExample.region}</h3>
            </div>
            <div className="turicum-allocation-modeler-stats">
              <div>
                <span>Illustrative Yield</span>
                <strong className="turicum-terminal-mono">{percentFormatter.format(selectedExample.projectedYield)}%</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{selectedExample.status}</strong>
              </div>
            </div>
          </div>

          <div className="turicum-allocation-slider-wrap">
            <div className="turicum-allocation-slider-label">
              <span>Modeled Allocation</span>
              <strong className="turicum-terminal-mono">{currencyFormatter.format(allocation)}</strong>
            </div>

            <label className="turicum-modeler-slider" htmlFor="allocation-modeling-tool">
              <span className="sr-only">Allocation modeling amount</span>
              <input
                id="allocation-modeling-tool"
                type="range"
                min={allocationBounds.min}
                max={allocationBounds.max}
                step={allocationBounds.step}
                value={allocation}
                onChange={(event) => setAllocation(Number(event.target.value))}
              />
            </label>

            <div className="turicum-allocation-slider-scale" aria-hidden="true">
              <span>{currencyFormatter.format(allocationBounds.min)}</span>
              <span>{currencyFormatter.format(allocationBounds.max)}</span>
            </div>
          </div>

          <div className="turicum-allocation-modeler-foot">
            <p className="turicum-allocation-disclaimer">
              Actual yields vary by specific asset selection. Enter the portal for live data.
            </p>
            <div className="turicum-opportunity-income-row turicum-allocation-income-row">
              <span>Your Est. Monthly Passive Income:</span>
              <strong className="turicum-terminal-mono">{currencyFormatter.format(monthlyIncome)}</strong>
            </div>
          </div>

          <div className="turicum-allocation-actions">
            <button
              type="button"
              className="secondary-button turicum-primary-button"
              onClick={() => setIsInvestorAccessOpen(true)}
            >
              Access Underwriting Room
            </button>
            <Link className="secondary-button" href={withBasePath("/investor-handoff")}>
              Review Partnership Deck
            </Link>
          </div>
        </div>
      </section>

      <InvestorAccessModal open={isInvestorAccessOpen} onClose={() => setIsInvestorAccessOpen(false)} />
    </>
  );
}
