"use client";

import { useRef, useState } from "react";

interface IntroCallRequestFormProps {
  action: string;
}

export function IntroCallRequestForm({ action }: IntroCallRequestFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [assetLocation, setAssetLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [urgency, setUrgency] = useState("");

  function goToStepTwo() {
    if (!formRef.current?.reportValidity()) {
      return;
    }

    setStep(2);
  }

  return (
    <form ref={formRef} className="form-grid turicum-intro-call-form" method="post" action={action}>
      <div className="turicum-intro-steps" aria-label="Intro call steps">
        <div className={`turicum-intro-step ${step === 1 ? "is-active" : step > 1 ? "is-complete" : ""}`}>
          <span className="turicum-intro-step-index">1</span>
          <div>
            <strong>Basic details</strong>
            <span>Name, email, loan amount</span>
          </div>
        </div>
        <div className={`turicum-intro-step ${step === 2 ? "is-active" : ""}`}>
          <span className="turicum-intro-step-index">2</span>
          <div>
            <strong>Property details</strong>
            <span>Location, type, urgency</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="turicum-intro-stage">
          <div className="turicum-intro-stage-head">
            <p className="eyebrow">Step 1 of 2</p>
            <h3>Start with the core borrower facts.</h3>
            <p className="helper">This keeps the first commitment small and gets the right lead moving faster.</p>
          </div>
          <div className="turicum-intro-stage-grid">
            <label className="field">
              <span>Full name</span>
              <input
                name="fullName"
                type="text"
                required={step === 1}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required={step === 1}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Loan amount</span>
              <input
                name="requestedAmount"
                type="text"
                required={step === 1}
                placeholder="$2,500,000"
                value={requestedAmount}
                onChange={(event) => setRequestedAmount(event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button className="turicum-primary-button" type="button" onClick={goToStepTwo}>Next</button>
          </div>
        </div>
      ) : (
        <div className="turicum-intro-stage">
          <div className="turicum-intro-stage-head">
            <p className="eyebrow">Step 2 of 2</p>
            <h3>Fill in the property context.</h3>
            <p className="helper">These details help Turicum understand fit and timing before the first conversation.</p>
          </div>
          <div className="turicum-intro-stage-grid">
            <label className="field">
              <span>Property location</span>
              <input
                name="assetLocation"
                type="text"
                required={step === 2}
                placeholder="Miami, FL"
                value={assetLocation}
                onChange={(event) => setAssetLocation(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Type</span>
              <input
                name="propertyType"
                type="text"
                required={step === 2}
                placeholder="Multifamily, office, industrial, land"
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Urgency</span>
              <input
                name="preferredTimeline"
                type="text"
                required={step === 2}
                placeholder="Need to close within 21 days"
                value={urgency}
                onChange={(event) => setUrgency(event.target.value)}
              />
            </label>
          </div>
          <input type="hidden" name="fullName" value={fullName} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="requestedAmount" value={requestedAmount} />
          <input type="hidden" name="phone" value="" />
          <input type="hidden" name="preferredDate" value="" />
          <input type="hidden" name="preferredTimeWindow" value="" />
          <input type="hidden" name="notes" value="" />
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button type="button" className="secondary-button" onClick={() => setStep(1)}>
              Back
            </button>
            <button className="turicum-primary-button" type="submit">Schedule Intro Call</button>
          </div>
        </div>
      )}
    </form>
  );
}
