"use client";

import { useMemo, useState } from "react";
import { withConfiguredBasePath } from "@/lib/turicum/runtime";

type Objective = "Capital Preservation" | "Monthly Income" | "Growth";
type Allocation = "$250k-$500k" | "$500k-$1M" | "$1M-$3M" | "$3M-$5M" | "$5M+";

type AccessState = {
  email: string;
  accreditedInvestor: "Yes" | "No" | "";
  primaryInvestmentObjective: Objective | "";
  targetAllocationSize: Allocation | "";
};

const objectiveOptions: Objective[] = ["Capital Preservation", "Monthly Income", "Growth"];
const allocationOptions: Allocation[] = ["$250k-$500k", "$500k-$1M", "$1M-$3M", "$3M-$5M", "$5M+"];

const initialState: AccessState = {
  email: "",
  accreditedInvestor: "",
  primaryInvestmentObjective: "",
  targetAllocationSize: ""
};

export function InvestorRequestAccessFlow() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<AccessState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const progress = useMemo(() => {
    if (isComplete) return 100;
    return ((step + 1) / 4) * 100;
  }, [isComplete, step]);

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(withConfiguredBasePath("/api/prospective-investor-inquiries"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: state.email,
          accreditedInvestor: state.accreditedInvestor,
          primaryInvestmentObjective: state.primaryInvestmentObjective,
          targetAllocationSize: state.targetAllocationSize
        })
      });

      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Unable to submit request.");
      }

      setIsComplete(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateState<K extends keyof AccessState>(key: K, value: AccessState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  return (
    <section id="request-access" className="panel turicum-public-card turicum-investor-gate-panel">
      <div className="turicum-investor-gate-progress-shell" aria-hidden="true">
        <div className="turicum-investor-gate-progress-track">
          <div className="turicum-investor-gate-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isComplete ? (
        <div className="turicum-investor-gate-identity-screen">
          <p className="eyebrow">Identity Verification</p>
          <h2>Thank you. A Turicum Principal will review your credentials.</h2>
          <p>
            Accredited-investor confirmation and portal access are usually handled within 4 hours.
          </p>
        </div>
      ) : (
        <>
          <div className="section-head compact turicum-investor-gate-head">
            <div>
              <p className="eyebrow">Request Access</p>
              <h2>Request investor login.</h2>
            </div>
          </div>

          {step === 0 ? (
            <div className="turicum-investor-gate-step">
              <p className="helper turicum-investor-gate-copy">
                Enter your work email to request investor credentials. Example: `analyst@realtymogul.com`.
              </p>
              <label className="field turicum-investor-gate-field">
                <span>Work email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="analyst@realtymogul.com"
                  value={state.email}
                  onChange={(event) => updateState("email", event.target.value)}
                  required
                />
              </label>
              <div className="form-actions turicum-inline-actions">
                <button
                  className="turicum-primary-button"
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={!state.email.trim()}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="turicum-investor-gate-step">
              <p className="turicum-investor-step-label">Step 1</p>
              <h3>Are you an Accredited Investor?</h3>
              <p className="helper turicum-investor-gate-copy">
                Turicum issues portal credentials only after confirming accredited-investor eligibility
                for private offerings. This step helps route the correct follow-up.
              </p>
              <div className="turicum-investor-choice-grid" role="radiogroup" aria-label="Accredited investor">
                {(["Yes", "No"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`turicum-investor-choice${state.accreditedInvestor === option ? " is-active" : ""}`}
                    onClick={() => updateState("accreditedInvestor", option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="form-actions turicum-inline-actions">
                <button type="button" className="secondary-button" onClick={() => setStep(0)}>Back</button>
                <button
                  className="turicum-primary-button"
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!state.accreditedInvestor}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="turicum-investor-gate-step">
              <p className="turicum-investor-step-label">Step 2</p>
              <h3>Primary Investment Objective?</h3>
              <div className="turicum-investor-choice-stack" role="radiogroup" aria-label="Primary investment objective">
                {objectiveOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`turicum-investor-choice is-stacked${state.primaryInvestmentObjective === option ? " is-active" : ""}`}
                    onClick={() => updateState("primaryInvestmentObjective", option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="form-actions turicum-inline-actions">
                <button type="button" className="secondary-button" onClick={() => setStep(1)}>Back</button>
                <button
                  className="turicum-primary-button"
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!state.primaryInvestmentObjective}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="turicum-investor-gate-step">
              <p className="turicum-investor-step-label">Step 3</p>
              <h3>Target Allocation Size?</h3>
              <div className="turicum-investor-choice-stack" role="radiogroup" aria-label="Target allocation size">
                {allocationOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`turicum-investor-choice is-stacked${state.targetAllocationSize === option ? " is-active" : ""}`}
                    onClick={() => updateState("targetAllocationSize", option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {error ? <p className="turicum-investor-gate-error">{error}</p> : null}
              <div className="form-actions turicum-inline-actions">
                <button type="button" className="secondary-button" onClick={() => setStep(2)} disabled={isSubmitting}>Back</button>
                <button
                  className="turicum-primary-button"
                  type="button"
                  onClick={handleSubmit}
                  disabled={!state.targetAllocationSize || isSubmitting}
                >
                  {isSubmitting ? "Submitting" : "Submit for Review"}
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
