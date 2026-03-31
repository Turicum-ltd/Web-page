"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CommercialLoanApplicationForm } from "@/components/turicum/commercial-loan-application-form";
import { withBasePath } from "@/lib/turicum/runtime";

function RequestIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m3.5 11.5 16-7-4.8 15-3.8-5.2-5.2-2.8Zm7.3 2.8 3.6-4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.6 4.8h2.8l1.4 3.8-1.7 1.9c.7 1.4 2 2.7 3.5 3.5l1.9-1.7 3.8 1.4v2.8c0 .7-.6 1.3-1.3 1.3-6.8 0-12.3-5.5-12.3-12.3 0-.7.6-1.3 1.3-1.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 10V8.3a4.5 4.5 0 1 1 9 0V10M6 10h12v9H6v-9Zm6 3.2v2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SuccessCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 12.3 10.7 15.5 16.8 8.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DecisionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.8 18.3 6v5.4c0 4.1-2.4 7.5-6.3 8.8-3.9-1.3-6.3-4.7-6.3-8.8V6L12 3.8Zm-2.4 8.3 1.7 1.8 3.6-3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const borrowerProcessTracker = [
  {
    title: "Request Call",
    status: "Active",
    icon: RequestIcon,
    isActive: true
  },
  {
    title: "15-Min Intro",
    status: "Pending",
    icon: CallIcon,
    isActive: false
  },
  {
    title: "Secure Intake",
    status: "Pending",
    icon: LockIcon,
    isActive: false
  },
  {
    title: "Decision",
    status: "Pending",
    icon: DecisionIcon,
    isActive: false
  }
];

type PreIntakeState = "locked" | "prompt" | "scheduled" | "skip";

interface BorrowerPortalEntryProps {
  applicationAction: string;
  introRequestAction: string;
  applicationSubmitted?: boolean;
  applicationSubmittedEmail?: string;
  introRequested?: boolean;
  introRequestedEmail?: string;
  preIntakeState: PreIntakeState;
  error?: string;
}

export function BorrowerPortalEntry({
  applicationAction,
  introRequestAction,
  applicationSubmitted,
  applicationSubmittedEmail,
  introRequested,
  introRequestedEmail,
  preIntakeState,
  error
}: BorrowerPortalEntryProps) {
  const [showScheduleForm, setShowScheduleForm] = useState(preIntakeState === "prompt");

  const applicationUnlocked =
    applicationSubmitted ||
    introRequested ||
    preIntakeState === "scheduled" ||
    preIntakeState === "skip";

  const introStatusMessage = useMemo(() => {
    if (preIntakeState === "skip") {
      return "You skipped straight to the full application. We’ve opened the profile step at the 7-year address and SSN section so you can move quickly if the file is ready.";
    }

    if (preIntakeState === "scheduled" || introRequested) {
      return introRequestedEmail
        ? `We recorded the intro-call request for ${introRequestedEmail}. You can keep going now by filling out the 7-year address and SSN section while the scheduling confirmation is underway.`
        : "We recorded the intro-call request. You can keep going now by filling out the 7-year address and SSN section while the scheduling confirmation is underway.";
    }

    return null;
  }, [introRequested, introRequestedEmail, preIntakeState]);

  return (
    <>
      {applicationSubmitted ? (
        <div className="panel subtle turicum-intro-success-state" role="status" aria-live="polite">
          <span className="turicum-intro-success-icon" aria-hidden="true">
            <SuccessCheckIcon />
          </span>
          <p className="eyebrow">Request received</p>
          <strong>Application Received!</strong>
          <p className="helper">
            {applicationSubmittedEmail
              ? `We’ve recorded the application for ${applicationSubmittedEmail}. Turicum can now review the borrower profile, financials, collateral, and declarations before the next conversation.`
              : "We’ve recorded the application and the Turicum team can now review the borrower profile, financials, collateral, and declarations."}
          </p>
          <p className="helper">
            You do not need the full document package ready yet. The secure intake packet and next steps will follow once the initial review is complete.
          </p>
        </div>
      ) : (
        <>
          {!applicationUnlocked ? (
            <div className="turicum-pre-intake-shell">
              <div className="turicum-pre-intake-splash panel subtle">
                <p className="eyebrow">Pre-intake</p>
                <h3>Start with a quick call or jump straight into the full borrower application.</h3>
                <p className="helper">
                  Borrowers who want a fast fit-check can book the intro first. If your file is already organized, you can skip directly to the 7-year address and SSN section of the profile step.
                </p>
                <div className="form-actions turicum-inline-actions turicum-pre-intake-actions">
                  <button
                    type="button"
                    className="secondary-button turicum-primary-button"
                    onClick={() => setShowScheduleForm((current) => !current)}
                    aria-expanded={showScheduleForm}
                    aria-controls="turicum-pre-intake-form"
                  >
                    Schedule Intro Call
                  </button>
                  <Link
                    className="secondary-button"
                    href={withBasePath("/portal?preintake=skip#application-profile-details")}
                  >
                    Skip to Full Application
                  </Link>
                </div>
              </div>

              {showScheduleForm ? (
                <form
                  id="turicum-pre-intake-form"
                  className="panel turicum-pre-intake-form"
                  method="post"
                  action={introRequestAction}
                >
                  <div className="section-head compact">
                    <div>
                      <p className="eyebrow">Schedule intro call</p>
                      <h3>Give us the basics and choose a preferred slot.</h3>
                    </div>
                  </div>
                  <div className="turicum-pre-intake-grid">
                    <label className="field">
                      <span>Name</span>
                      <input type="text" name="fullName" required autoComplete="name" />
                    </label>
                    <label className="field">
                      <span>Email</span>
                      <input type="email" name="email" required autoComplete="email" />
                    </label>
                    <label className="field">
                      <span>Phone</span>
                      <input type="tel" name="phone" required autoComplete="tel" />
                    </label>
                    <label className="field">
                      <span>Preferred date</span>
                      <input type="date" name="preferredDate" />
                    </label>
                    <label className="field">
                      <span>Preferred time</span>
                      <select name="preferredTimeWindow" defaultValue="">
                        <option value="">Select a window</option>
                        <option value="Morning">Morning</option>
                        <option value="Midday">Midday</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-actions turicum-inline-actions turicum-pre-intake-actions">
                    <button type="submit" className="secondary-button turicum-primary-button">
                      Schedule
                    </button>
                    <Link
                      className="secondary-button"
                      href={withBasePath("/portal?preintake=skip#application-profile-details")}
                    >
                      Skip to Full Application
                    </Link>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div className="panel subtle">
              <strong>We could not submit the request.</strong>
              <p className="helper">{error}</p>
            </div>
          ) : null}

          {applicationUnlocked ? (
            <>
              {introStatusMessage ? (
                <div className="panel subtle turicum-pre-intake-status" role="status" aria-live="polite">
                  <p className="eyebrow">Application unlocked</p>
                  <p className="helper">{introStatusMessage}</p>
                </div>
              ) : null}
              <div className="turicum-process-tracker" aria-label="Borrower process tracker">
                <div className="turicum-process-tracker-head">
                  <p className="eyebrow">Process tracker</p>
                  <p className="helper turicum-process-tracker-note">
                    This application organizes the borrower profile, balance sheet, subject property,
                    and declarations before secure intake opens.
                  </p>
                </div>
                <div className="turicum-process-tracker-track">
                  {borrowerProcessTracker.map((step) => (
                    <article
                      key={step.title}
                      className={`turicum-process-step ${step.isActive ? "is-active" : "is-pending"}`}
                    >
                      <span className="turicum-process-step-icon" aria-hidden="true">
                        <step.icon />
                      </span>
                      <strong>{step.title}</strong>
                      <span className="turicum-process-step-status">{step.status}</span>
                    </article>
                  ))}
                </div>
              </div>
              <CommercialLoanApplicationForm action={applicationAction} />
            </>
          ) : null}
        </>
      )}
    </>
  );
}
