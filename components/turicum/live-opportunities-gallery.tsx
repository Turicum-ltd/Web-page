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
    id: "industrial-bridge-example",
    title: "Industrial Bridge Example",
    location: "Illustrative Sunbelt market",
    assetType: "Industrial",
    ltv: 65,
    annualReturn: 10.5,
    minParticipation: 25000,
    maxParticipation: 250000,
    step: 25000,
    defaultParticipation: 100000,
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    summary: "Illustrative first-lien industrial bridge structure shown to demonstrate leverage, yield posture, and participation sizing before investors enter the secure portal."
  },
  {
    id: "multifamily-refinance-example",
    title: "Multifamily Refinance Example",
    location: "Illustrative Southeast market",
    assetType: "Multifamily",
    ltv: 62,
    annualReturn: 10.2,
    minParticipation: 25000,
    maxParticipation: 250000,
    step: 25000,
    defaultParticipation: 75000,
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
    summary: "Illustrative multifamily refinance structure with conservative leverage and passive income modeling shown for preview purposes only."
  },
  {
    id: "storage-expansion-example",
    title: "Storage Expansion Example",
    location: "Illustrative Southwest market",
    assetType: "Self-Storage",
    ltv: 68,
    annualReturn: 11.0,
    minParticipation: 25000,
    maxParticipation: 250000,
    step: 25000,
    defaultParticipation: 125000,
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    summary: "Illustrative asset-based expansion profile presented as a sample of the structures investors can evaluate after authentication."
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
          <p className="eyebrow">Illustrative example</p>
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
            <span className="turicum-opportunity-badge">Login for live details</span>
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
          Log In to View Live Opportunities
        </Link>
      </div>
    </article>
  );
}

export function LiveOpportunitiesGallery() {
  return (
    <section id="current-opportunities" className="turicum-live-opportunities-section">
      <div className="turicum-section-intro compact">
        <p className="eyebrow">Illustrative Examples</p>
        <h2>Review example structures and model participation before investor login.</h2>
        <p>
          The landing page now shows representative examples only. Live promoted opportunities,
          property names, and current allocations stay inside the secure investor portal.
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
