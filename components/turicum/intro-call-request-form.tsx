"use client";

import { useRef, useState } from "react";

interface IntroCallRequestFormProps {
  action: string;
}

type IntroFieldKey =
  | "fullName"
  | "email"
  | "requestedAmount"
  | "assetLocation"
  | "propertyType"
  | "urgency";

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatAmount(value: string) {
  if (!value) {
    return "";
  }

  return Number(value).toLocaleString("en-US");
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
  const [touched, setTouched] = useState<Record<IntroFieldKey, boolean>>({
    fullName: false,
    email: false,
    requestedAmount: false,
    assetLocation: false,
    propertyType: false,
    urgency: false
  });

  const trimmedFullName = fullName.trim();
  const trimmedEmail = email.trim();
  const trimmedLocation = assetLocation.trim();
  const trimmedPropertyType = propertyType.trim();
  const trimmedUrgency = urgency.trim();
  const formattedAmount = formatAmount(requestedAmount);

  const stepOneValid =
    trimmedFullName.length > 0 &&
    isEmailValid(trimmedEmail) &&
    requestedAmount.length > 0;
  const stepTwoValid =
    stepOneValid &&
    trimmedLocation.length > 0 &&
    trimmedPropertyType.length > 0 &&
    trimmedUrgency.length > 0;

  function markTouched(fields: IntroFieldKey[]) {
    setTouched((current) => {
      const next = { ...current };

      for (const field of fields) {
        next[field] = true;
      }

      return next;
    });
  }

  function handleBlur(field: IntroFieldKey) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function goToStepTwo() {
    markTouched(["fullName", "email", "requestedAmount"]);

    if (!stepOneValid) {
      return;
    }

    setStep(2);
  }

  function getFieldError(field: IntroFieldKey) {
    if (!touched[field]) {
      return null;
    }

    if (field === "email") {
      if (!trimmedEmail) {
        return "Required";
      }

      if (!isEmailValid(trimmedEmail)) {
        return "Enter a valid email";
      }

      return null;
    }

    if (field === "fullName" && !trimmedFullName) {
      return "Required";
    }

    if (field === "requestedAmount" && !requestedAmount) {
      return "Required";
    }

    if (field === "assetLocation" && !trimmedLocation) {
      return "Required";
    }

    if (field === "propertyType" && !trimmedPropertyType) {
      return "Required";
    }

    if (field === "urgency" && !trimmedUrgency) {
      return "Required";
    }

    return null;
  }

  function fieldClassName(field: IntroFieldKey) {
    return `field${getFieldError(field) ? " is-invalid" : ""}`;
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
            <label className={fieldClassName("fullName")}>
              <span>Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                onBlur={() => handleBlur("fullName")}
                aria-invalid={Boolean(getFieldError("fullName"))}
              />
              {getFieldError("fullName") ? (
                <small className="turicum-field-error">{getFieldError("fullName")}</small>
              ) : null}
            </label>
            <label className={fieldClassName("email")}>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={Boolean(getFieldError("email"))}
              />
              {getFieldError("email") ? (
                <small className="turicum-field-error">{getFieldError("email")}</small>
              ) : null}
            </label>
            <label className={fieldClassName("requestedAmount")}>
              <span>Loan amount</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="500,000"
                value={formattedAmount}
                onChange={(event) =>
                  setRequestedAmount(event.target.value.replace(/\D/g, ""))
                }
                onBlur={() => handleBlur("requestedAmount")}
                aria-invalid={Boolean(getFieldError("requestedAmount"))}
              />
              {getFieldError("requestedAmount") ? (
                <small className="turicum-field-error">{getFieldError("requestedAmount")}</small>
              ) : null}
            </label>
          </div>
          <input type="hidden" name="fullName" value={trimmedFullName} />
          <input type="hidden" name="email" value={trimmedEmail} />
          <input type="hidden" name="requestedAmount" value={formattedAmount} />
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button
              className="turicum-primary-button"
              type="button"
              onClick={goToStepTwo}
              disabled={!stepOneValid}
            >
              Next
            </button>
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
            <label className={fieldClassName("assetLocation")}>
              <span>Property location</span>
              <input
                name="assetLocation"
                type="text"
                placeholder="Miami, FL"
                value={assetLocation}
                onChange={(event) => setAssetLocation(event.target.value)}
                onBlur={() => handleBlur("assetLocation")}
                aria-invalid={Boolean(getFieldError("assetLocation"))}
              />
              {getFieldError("assetLocation") ? (
                <small className="turicum-field-error">{getFieldError("assetLocation")}</small>
              ) : null}
            </label>
            <label className={fieldClassName("propertyType")}>
              <span>Type</span>
              <input
                name="propertyType"
                type="text"
                placeholder="Multifamily, office, industrial, land"
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                onBlur={() => handleBlur("propertyType")}
                aria-invalid={Boolean(getFieldError("propertyType"))}
              />
              {getFieldError("propertyType") ? (
                <small className="turicum-field-error">{getFieldError("propertyType")}</small>
              ) : null}
            </label>
            <label className={fieldClassName("urgency")}>
              <span>Urgency</span>
              <input
                name="preferredTimeline"
                type="text"
                placeholder="Need to close within 21 days"
                value={urgency}
                onChange={(event) => setUrgency(event.target.value)}
                onBlur={() => handleBlur("urgency")}
                aria-invalid={Boolean(getFieldError("urgency"))}
              />
              {getFieldError("urgency") ? (
                <small className="turicum-field-error">{getFieldError("urgency")}</small>
              ) : null}
            </label>
          </div>
          <input type="hidden" name="fullName" value={trimmedFullName} />
          <input type="hidden" name="email" value={trimmedEmail} />
          <input type="hidden" name="requestedAmount" value={formattedAmount} />
          <input type="hidden" name="phone" value="" />
          <input type="hidden" name="preferredDate" value="" />
          <input type="hidden" name="preferredTimeWindow" value="" />
          <input type="hidden" name="notes" value="" />
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button type="button" className="secondary-button" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              className="turicum-primary-button"
              type="submit"
              disabled={!stepTwoValid}
              onClick={() => markTouched(["assetLocation", "propertyType", "urgency", "email"])}
            >
              Schedule Intro Call
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
