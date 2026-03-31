"use client";

import Link from "next/link";
import { useState } from "react";
import { withBasePath } from "@/lib/turicum/runtime";

interface LiveOpportunity {
  id: string;
  title: string;
  location: string;
  assetType: string;
  ltv: number;
  annualReturn: number;
  minParticipation: number;
  maxParticipation: number;
  step: number;
  defaultParticipation: number;
  image: string;
  summary: string;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const returnFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const liveOpportunities: LiveOpportunity[] = [
  {
    id: "nashville-industrial",
    title: "Nashville Logistics Infill",
    location: "Nashville, Tennessee",
    assetType: "Industrial",
    ltv: 65,
    annualReturn: 10.5,
    minParticipation: 25000,
    maxParticipation: 250000,
    step: 25000,
    defaultParticipation: 100000,
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    summary: "Short-duration infill warehouse refinance with first-lien security, sponsor equity already in place, and cash-flow visibility from seasoned tenancy."
  },
  {
    id: "charlotte-multifamily",
    title: "Charlotte Workforce Housing",
    location: "Charlotte, North Carolina",
    assetType: "Multifamily",
    ltv: 62,
    annualReturn: 10.2,
    minParticipation: 25000,
    maxParticipation: 250000,
    step: 25000,
    defaultParticipation: 75000,
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    summary: "Stabilized multifamily bridge execution with conservative leverage, durable in-place rents, and a clearly defined refinance path."
  },
  {
    id: "phoenix-self-storage",
    title: "Phoenix Storage Expansion",
    location: "Phoenix, Arizona",
    assetType: "Self-Storage",
    ltv: 68,
    annualReturn: 11.0,
    minParticipation: 25000,
    maxParticipation: 250000,
    step: 25000,
    defaultParticipation: 125000,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    summary: "Asset-based expansion capital secured by first-position collateral, reserve discipline, and monthly operational reporting through completion."
  }
];

function calculateMonthlyIncome(participation: number, annualReturn: number) {
  return Math.round((participation * (annualReturn / 100)) / 12);
}

function OpportunityCard({ opportunity }: { opportunity: LiveOpportunity }) {
  const [participation, setParticipation] = useState(opportunity.defaultParticipation);
  const monthlyIncome = calculateMonthlyIncome(participation, opportunity.annualReturn);

  return (
    <article className="turicum-opportunity-card">
      <div
        className="turicum-opportunity-image"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(9, 9, 11, 0.08), rgba(9, 9, 11, 0.62)), url(${opportunity.image})`
        }}
        aria-hidden="true"
      >
        <div className="turicum-opportunity-badges">
          <span className="turicum-opportunity-badge is-strong">{opportunity.ltv}% LTV</span>
          <span className="turicum-opportunity-badge">{opportunity.assetType}</span>
        </div>
        <div className="turicum-opportunity-image-copy">
          <p className="eyebrow">Live opportunity</p>
          <h3>{opportunity.title}</h3>
          <p className="helper">{opportunity.location}</p>
        </div>
      </div>

      <div className="turicum-opportunity-body">
        <div className="turicum-opportunity-metrics">
          <div className="turicum-opportunity-metric">
            <span>Projected Annual Return</span>
            <strong>{returnFormatter.format(opportunity.annualReturn)}%</strong>
          </div>
          <div className="turicum-opportunity-metric">
            <span>Asset Type</span>
            <strong>{opportunity.assetType}</strong>
          </div>
          <div className="turicum-opportunity-metric">
            <span>Participation Range</span>
            <strong>
              {currencyFormatter.format(opportunity.minParticipation)} - {currencyFormatter.format(opportunity.maxParticipation)}
            </strong>
          </div>
        </div>

        <p className="helper turicum-opportunity-summary">{opportunity.summary}</p>

        <div className="turicum-opportunity-slider-panel">
          <div className="turicum-opportunity-slider-head">
            <div>
              <p className="eyebrow">Participation Slider</p>
              <strong>{currencyFormatter.format(participation)}</strong>
            </div>
            <span className="turicum-opportunity-badge">Secure portal funding</span>
          </div>

          <label className="turicum-opportunity-slider" htmlFor={`participation-${opportunity.id}`}>
            <span className="sr-only">Participation amount for {opportunity.title}</span>
            <input
              id={`participation-${opportunity.id}`}
              type="range"
              min={opportunity.minParticipation}
              max={opportunity.maxParticipation}
              step={opportunity.step}
              value={participation}
              onChange={(event) => setParticipation(Number(event.target.value))}
            />
          </label>

          <div className="turicum-opportunity-slider-scale" aria-hidden="true">
            <span>{currencyFormatter.format(opportunity.minParticipation)}</span>
            <span>{currencyFormatter.format(opportunity.maxParticipation)}</span>
          </div>
        </div>

        <div className="turicum-opportunity-income-row">
          <span>Your Est. Monthly Passive Income:</span>
          <strong>{currencyFormatter.format(monthlyIncome)}</strong>
        </div>

        <Link className="secondary-button turicum-primary-button turicum-opportunity-cta" href={withBasePath("/investors")}>
          Commit Capital
        </Link>
      </div>
    </article>
  );
}

export function LiveOpportunitiesGallery() {
  return (
    <section id="current-opportunities" className="turicum-live-opportunities-section">
      <div className="turicum-section-intro compact">
        <p className="eyebrow">Live Opportunities</p>
        <h2>Review current opportunities and model your participation in real time.</h2>
        <p>
          Each live opportunity shows leverage, projected return, asset type, and a participation
          slider so investors can preview passive monthly income before entering the secure portal.
        </p>
      </div>

      <div className="turicum-live-opportunities-grid">
        {liveOpportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
    </section>
  );
}
