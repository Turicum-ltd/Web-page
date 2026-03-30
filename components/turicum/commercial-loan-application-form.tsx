"use client";

import { useRef, useState } from "react";

interface CommercialLoanApplicationFormProps {
  action: string;
}

type Step = 1 | 2 | 3 | 4;
type FieldKey =
  | "primaryBorrowerName"
  | "primaryBorrowerEmail"
  | "primaryBorrowerPhone"
  | "coBorrowerName"
  | "coBorrowerEmail"
  | "currentAddress"
  | "formerAddress"
  | "annualIncome"
  | "cashOnHand"
  | "realEstateAssets"
  | "retirementAssets"
  | "mortgageDebt"
  | "creditorDebt"
  | "otherLiabilities"
  | "requestedAmount"
  | "propertyAddress"
  | "propertyType"
  | "borrowingEntityName"
  | "bankruptcyHistory"
  | "lawsuitHistory"
  | "judgmentHistory"
  | "declarationNotes";

const propertyTypeOptions = [
  "Multifamily",
  "Mixed-Use",
  "Industrial",
  "Retail",
  "Office",
  "Hospitality",
  "Land",
  "Other"
];

const declarationOptions = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" }
];

function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatCurrencyDigits(value: string) {
  if (!value) {
    return "";
  }

  return Number(value).toLocaleString("en-US");
}

function normalizeCurrencyInput(value: string) {
  return value.replace(/\D/g, "");
}

export function CommercialLoanApplicationForm({ action }: CommercialLoanApplicationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    primaryBorrowerName: false,
    primaryBorrowerEmail: false,
    primaryBorrowerPhone: false,
    coBorrowerName: false,
    coBorrowerEmail: false,
    currentAddress: false,
    formerAddress: false,
    annualIncome: false,
    cashOnHand: false,
    realEstateAssets: false,
    retirementAssets: false,
    mortgageDebt: false,
    creditorDebt: false,
    otherLiabilities: false,
    requestedAmount: false,
    propertyAddress: false,
    propertyType: false,
    borrowingEntityName: false,
    bankruptcyHistory: false,
    lawsuitHistory: false,
    judgmentHistory: false,
    declarationNotes: false
  });

  const [primaryBorrowerName, setPrimaryBorrowerName] = useState("");
  const [primaryBorrowerEmail, setPrimaryBorrowerEmail] = useState("");
  const [primaryBorrowerPhone, setPrimaryBorrowerPhone] = useState("");
  const [coBorrowerName, setCoBorrowerName] = useState("");
  const [coBorrowerEmail, setCoBorrowerEmail] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [formerAddress, setFormerAddress] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [cashOnHand, setCashOnHand] = useState("");
  const [realEstateAssets, setRealEstateAssets] = useState("");
  const [retirementAssets, setRetirementAssets] = useState("");
  const [mortgageDebt, setMortgageDebt] = useState("");
  const [creditorDebt, setCreditorDebt] = useState("");
  const [otherLiabilities, setOtherLiabilities] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [borrowingEntityName, setBorrowingEntityName] = useState("");
  const [bankruptcyHistory, setBankruptcyHistory] = useState("");
  const [lawsuitHistory, setLawsuitHistory] = useState("");
  const [judgmentHistory, setJudgmentHistory] = useState("");
  const [declarationNotes, setDeclarationNotes] = useState("");

  const trimmedBorrowerName = primaryBorrowerName.trim();
  const trimmedBorrowerEmail = primaryBorrowerEmail.trim();
  const trimmedBorrowerPhone = primaryBorrowerPhone.trim();
  const trimmedCurrentAddress = currentAddress.trim();
  const trimmedPropertyAddress = propertyAddress.trim();
  const trimmedPropertyType = propertyType.trim();
  const trimmedBorrowingEntityName = borrowingEntityName.trim();

  const stepOneValid =
    trimmedBorrowerName.length > 0 &&
    isEmailValid(trimmedBorrowerEmail) &&
    trimmedBorrowerPhone.length > 0 &&
    trimmedCurrentAddress.length > 0 &&
    annualIncome.length > 0;
  const stepTwoValid =
    cashOnHand.length > 0 &&
    realEstateAssets.length > 0 &&
    retirementAssets.length > 0 &&
    mortgageDebt.length > 0 &&
    creditorDebt.length > 0;
  const stepThreeValid =
    requestedAmount.length > 0 &&
    trimmedPropertyAddress.length > 0 &&
    trimmedPropertyType.length > 0 &&
    trimmedBorrowingEntityName.length > 0;
  const stepFourValid =
    bankruptcyHistory.length > 0 &&
    lawsuitHistory.length > 0 &&
    judgmentHistory.length > 0;

  function markTouched(fields: FieldKey[]) {
    setTouched((current) => {
      const next = { ...current };

      for (const field of fields) {
        next[field] = true;
      }

      return next;
    });
  }

  function handleBlur(field: FieldKey) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function fieldClassName(field: FieldKey) {
    return `field${getFieldError(field) ? " is-invalid" : ""}`;
  }

  function getFieldError(field: FieldKey) {
    if (!touched[field]) {
      return null;
    }

    if (field === "primaryBorrowerEmail") {
      if (!trimmedBorrowerEmail) {
        return "Required";
      }

      if (!isEmailValid(trimmedBorrowerEmail)) {
        return "Enter a valid email";
      }

      return null;
    }

    const requiredMap: Partial<Record<FieldKey, boolean>> = {
      primaryBorrowerName: !trimmedBorrowerName,
      primaryBorrowerPhone: !trimmedBorrowerPhone,
      currentAddress: !trimmedCurrentAddress,
      annualIncome: !annualIncome,
      cashOnHand: !cashOnHand,
      realEstateAssets: !realEstateAssets,
      retirementAssets: !retirementAssets,
      mortgageDebt: !mortgageDebt,
      creditorDebt: !creditorDebt,
      requestedAmount: !requestedAmount,
      propertyAddress: !trimmedPropertyAddress,
      propertyType: !trimmedPropertyType,
      borrowingEntityName: !trimmedBorrowingEntityName,
      bankruptcyHistory: !bankruptcyHistory,
      lawsuitHistory: !lawsuitHistory,
      judgmentHistory: !judgmentHistory
    };

    if (requiredMap[field]) {
      return "Required";
    }

    return null;
  }

  function nextStep(currentStep: Step) {
    if (currentStep === 1) {
      markTouched([
        "primaryBorrowerName",
        "primaryBorrowerEmail",
        "primaryBorrowerPhone",
        "currentAddress",
        "annualIncome"
      ]);
      if (!stepOneValid) {
        return;
      }
      setStep(2);
      return;
    }

    if (currentStep === 2) {
      markTouched([
        "cashOnHand",
        "realEstateAssets",
        "retirementAssets",
        "mortgageDebt",
        "creditorDebt"
      ]);
      if (!stepTwoValid) {
        return;
      }
      setStep(3);
      return;
    }

    if (currentStep === 3) {
      markTouched([
        "requestedAmount",
        "propertyAddress",
        "propertyType",
        "borrowingEntityName"
      ]);
      if (!stepThreeValid) {
        return;
      }
      setStep(4);
    }
  }

  return (
    <form ref={formRef} className="form-grid turicum-intro-call-form" method="post" action={action}>
      <div className="turicum-intro-steps" aria-label="Commercial loan application steps">
        <div className={`turicum-intro-step ${step === 1 ? "is-active" : step > 1 ? "is-complete" : ""}`}>
          <span className="turicum-intro-step-index">1</span>
          <div>
            <strong>Profile</strong>
            <span>Borrower, address history, income</span>
          </div>
        </div>
        <div className={`turicum-intro-step ${step === 2 ? "is-active" : step > 2 ? "is-complete" : ""}`}>
          <span className="turicum-intro-step-index">2</span>
          <div>
            <strong>Financials</strong>
            <span>Assets and liabilities</span>
          </div>
        </div>
        <div className={`turicum-intro-step ${step === 3 ? "is-active" : step > 3 ? "is-complete" : ""}`}>
          <span className="turicum-intro-step-index">3</span>
          <div>
            <strong>Subject Property</strong>
            <span>Loan request and collateral</span>
          </div>
        </div>
        <div className={`turicum-intro-step ${step === 4 ? "is-active" : ""}`}>
          <span className="turicum-intro-step-index">4</span>
          <div>
            <strong>Declarations</strong>
            <span>Legal history questions</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="turicum-intro-stage">
          <div className="turicum-intro-stage-head">
            <p className="eyebrow">Step 1 of 4</p>
            <h3>Profile</h3>
            <p className="helper">Capture borrower and co-borrower details, 7-year address history, and annual income.</p>
          </div>
          <div className="turicum-intro-stage-grid turicum-application-profile-grid">
            <label className={fieldClassName("primaryBorrowerName")}>
              <span>Borrower name</span>
              <input value={primaryBorrowerName} onChange={(e) => setPrimaryBorrowerName(e.target.value)} onBlur={() => handleBlur("primaryBorrowerName")} />
              {getFieldError("primaryBorrowerName") ? <small className="turicum-field-error">{getFieldError("primaryBorrowerName")}</small> : null}
            </label>
            <label className={fieldClassName("primaryBorrowerEmail")}>
              <span>Borrower email</span>
              <input type="email" value={primaryBorrowerEmail} onChange={(e) => setPrimaryBorrowerEmail(e.target.value)} onBlur={() => handleBlur("primaryBorrowerEmail")} />
              {getFieldError("primaryBorrowerEmail") ? <small className="turicum-field-error">{getFieldError("primaryBorrowerEmail")}</small> : null}
            </label>
            <label className={fieldClassName("primaryBorrowerPhone")}>
              <span>Borrower phone</span>
              <input type="tel" value={primaryBorrowerPhone} onChange={(e) => setPrimaryBorrowerPhone(e.target.value)} onBlur={() => handleBlur("primaryBorrowerPhone")} />
              {getFieldError("primaryBorrowerPhone") ? <small className="turicum-field-error">{getFieldError("primaryBorrowerPhone")}</small> : null}
            </label>
            <label className={fieldClassName("coBorrowerName")}>
              <span>Co-borrower name</span>
              <input value={coBorrowerName} onChange={(e) => setCoBorrowerName(e.target.value)} onBlur={() => handleBlur("coBorrowerName")} />
            </label>
            <label className={fieldClassName("coBorrowerEmail")}>
              <span>Co-borrower email</span>
              <input type="email" value={coBorrowerEmail} onChange={(e) => setCoBorrowerEmail(e.target.value)} onBlur={() => handleBlur("coBorrowerEmail")} />
            </label>
            <label className={fieldClassName("annualIncome")}>
              <span>Annual income</span>
              <input
                inputMode="numeric"
                placeholder="250,000"
                value={formatCurrencyDigits(annualIncome)}
                onChange={(e) => setAnnualIncome(normalizeCurrencyInput(e.target.value))}
                onBlur={() => handleBlur("annualIncome")}
              />
              {getFieldError("annualIncome") ? <small className="turicum-field-error">{getFieldError("annualIncome")}</small> : null}
            </label>
            <label className={`${fieldClassName("currentAddress")} turicum-application-span-full`}>
              <span>Current address</span>
              <textarea value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} onBlur={() => handleBlur("currentAddress")} rows={3} />
              {getFieldError("currentAddress") ? <small className="turicum-field-error">{getFieldError("currentAddress")}</small> : null}
            </label>
            <label className={`${fieldClassName("formerAddress")} turicum-application-span-full`}>
              <span>Former address (if not at current address for 7 years)</span>
              <textarea value={formerAddress} onChange={(e) => setFormerAddress(e.target.value)} onBlur={() => handleBlur("formerAddress")} rows={3} />
            </label>
          </div>
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button type="button" className="turicum-primary-button" onClick={() => nextStep(1)} disabled={!stepOneValid}>
              Next
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="turicum-intro-stage">
          <div className="turicum-intro-stage-head">
            <p className="eyebrow">Step 2 of 4</p>
            <h3>Financials</h3>
            <p className="helper">Lay out the major asset and liability buckets so underwriting can size the file quickly.</p>
          </div>
          <div className="turicum-application-balance-sheet">
            <div className="turicum-application-balance-column">
              <p className="eyebrow">Assets</p>
              <label className={fieldClassName("cashOnHand")}>
                <span>Cash</span>
                <input inputMode="numeric" value={formatCurrencyDigits(cashOnHand)} onChange={(e) => setCashOnHand(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("cashOnHand")} />
                {getFieldError("cashOnHand") ? <small className="turicum-field-error">{getFieldError("cashOnHand")}</small> : null}
              </label>
              <label className={fieldClassName("realEstateAssets")}>
                <span>Real Estate</span>
                <input inputMode="numeric" value={formatCurrencyDigits(realEstateAssets)} onChange={(e) => setRealEstateAssets(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("realEstateAssets")} />
                {getFieldError("realEstateAssets") ? <small className="turicum-field-error">{getFieldError("realEstateAssets")}</small> : null}
              </label>
              <label className={fieldClassName("retirementAssets")}>
                <span>Retirement</span>
                <input inputMode="numeric" value={formatCurrencyDigits(retirementAssets)} onChange={(e) => setRetirementAssets(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("retirementAssets")} />
                {getFieldError("retirementAssets") ? <small className="turicum-field-error">{getFieldError("retirementAssets")}</small> : null}
              </label>
            </div>
            <div className="turicum-application-balance-column">
              <p className="eyebrow">Liabilities</p>
              <label className={fieldClassName("mortgageDebt")}>
                <span>Mortgages</span>
                <input inputMode="numeric" value={formatCurrencyDigits(mortgageDebt)} onChange={(e) => setMortgageDebt(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("mortgageDebt")} />
                {getFieldError("mortgageDebt") ? <small className="turicum-field-error">{getFieldError("mortgageDebt")}</small> : null}
              </label>
              <label className={fieldClassName("creditorDebt")}>
                <span>Creditors</span>
                <input inputMode="numeric" value={formatCurrencyDigits(creditorDebt)} onChange={(e) => setCreditorDebt(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("creditorDebt")} />
                {getFieldError("creditorDebt") ? <small className="turicum-field-error">{getFieldError("creditorDebt")}</small> : null}
              </label>
              <label className={fieldClassName("otherLiabilities")}>
                <span>Other liabilities</span>
                <input inputMode="numeric" value={formatCurrencyDigits(otherLiabilities)} onChange={(e) => setOtherLiabilities(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("otherLiabilities")} />
              </label>
            </div>
          </div>
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button type="button" className="secondary-button" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="turicum-primary-button" onClick={() => nextStep(2)} disabled={!stepTwoValid}>
              Next
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="turicum-intro-stage">
          <div className="turicum-intro-stage-head">
            <p className="eyebrow">Step 3 of 4</p>
            <h3>Subject Property</h3>
            <p className="helper">Define the collateral, requested size, and borrowing entity.</p>
          </div>
          <div className="turicum-intro-stage-grid">
            <label className={fieldClassName("requestedAmount")}>
              <span>Loan amount</span>
              <input inputMode="numeric" value={formatCurrencyDigits(requestedAmount)} onChange={(e) => setRequestedAmount(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("requestedAmount")} />
              {getFieldError("requestedAmount") ? <small className="turicum-field-error">{getFieldError("requestedAmount")}</small> : null}
            </label>
            <label className={fieldClassName("propertyType")}>
              <span>Property type</span>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} onBlur={() => handleBlur("propertyType")}>
                <option value="">Select type</option>
                {propertyTypeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {getFieldError("propertyType") ? <small className="turicum-field-error">{getFieldError("propertyType")}</small> : null}
            </label>
            <label className={fieldClassName("borrowingEntityName")}>
              <span>Borrowing entity name</span>
              <input value={borrowingEntityName} onChange={(e) => setBorrowingEntityName(e.target.value)} onBlur={() => handleBlur("borrowingEntityName")} />
              {getFieldError("borrowingEntityName") ? <small className="turicum-field-error">{getFieldError("borrowingEntityName")}</small> : null}
            </label>
            <label className={`${fieldClassName("propertyAddress")} turicum-application-span-full`}>
              <span>Property address</span>
              <textarea value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} onBlur={() => handleBlur("propertyAddress")} rows={3} />
              {getFieldError("propertyAddress") ? <small className="turicum-field-error">{getFieldError("propertyAddress")}</small> : null}
            </label>
          </div>
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button type="button" className="secondary-button" onClick={() => setStep(2)}>
              Back
            </button>
            <button type="button" className="turicum-primary-button" onClick={() => nextStep(3)} disabled={!stepThreeValid}>
              Next
            </button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="turicum-intro-stage">
          <div className="turicum-intro-stage-head">
            <p className="eyebrow">Step 4 of 4</p>
            <h3>Declarations</h3>
            <p className="helper">Answer the legal history questions so the first review starts with the right flags in view.</p>
          </div>
          <div className="turicum-intro-stage-grid turicum-application-declarations-grid">
            <label className={fieldClassName("bankruptcyHistory")}>
              <span>Any bankruptcies?</span>
              <select value={bankruptcyHistory} onChange={(e) => setBankruptcyHistory(e.target.value)} onBlur={() => handleBlur("bankruptcyHistory")}>
                <option value="">Select</option>
                {declarationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {getFieldError("bankruptcyHistory") ? <small className="turicum-field-error">{getFieldError("bankruptcyHistory")}</small> : null}
            </label>
            <label className={fieldClassName("lawsuitHistory")}>
              <span>Any lawsuits?</span>
              <select value={lawsuitHistory} onChange={(e) => setLawsuitHistory(e.target.value)} onBlur={() => handleBlur("lawsuitHistory")}>
                <option value="">Select</option>
                {declarationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {getFieldError("lawsuitHistory") ? <small className="turicum-field-error">{getFieldError("lawsuitHistory")}</small> : null}
            </label>
            <label className={fieldClassName("judgmentHistory")}>
              <span>Any judgments?</span>
              <select value={judgmentHistory} onChange={(e) => setJudgmentHistory(e.target.value)} onBlur={() => handleBlur("judgmentHistory")}>
                <option value="">Select</option>
                {declarationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {getFieldError("judgmentHistory") ? <small className="turicum-field-error">{getFieldError("judgmentHistory")}</small> : null}
            </label>
            <label className="field turicum-application-span-full">
              <span>Notes</span>
              <textarea value={declarationNotes} onChange={(e) => setDeclarationNotes(e.target.value)} onBlur={() => handleBlur("declarationNotes")} rows={4} />
            </label>
          </div>
          <div className="form-actions turicum-inline-actions turicum-intro-step-actions">
            <button type="button" className="secondary-button" onClick={() => setStep(3)}>
              Back
            </button>
            <button type="submit" className="turicum-primary-button" disabled={!stepFourValid}>
              Submit Application
            </button>
          </div>
        </div>
      ) : null}

      <input type="hidden" name="primaryBorrowerName" value={trimmedBorrowerName} />
      <input type="hidden" name="primaryBorrowerEmail" value={trimmedBorrowerEmail} />
      <input type="hidden" name="primaryBorrowerPhone" value={trimmedBorrowerPhone} />
      <input type="hidden" name="coBorrowerName" value={coBorrowerName.trim()} />
      <input type="hidden" name="coBorrowerEmail" value={coBorrowerEmail.trim()} />
      <input type="hidden" name="currentAddress" value={trimmedCurrentAddress} />
      <input type="hidden" name="formerAddress" value={formerAddress.trim()} />
      <input type="hidden" name="annualIncome" value={formatCurrencyDigits(annualIncome)} />
      <input type="hidden" name="cashOnHand" value={formatCurrencyDigits(cashOnHand)} />
      <input type="hidden" name="realEstateAssets" value={formatCurrencyDigits(realEstateAssets)} />
      <input type="hidden" name="retirementAssets" value={formatCurrencyDigits(retirementAssets)} />
      <input type="hidden" name="mortgageDebt" value={formatCurrencyDigits(mortgageDebt)} />
      <input type="hidden" name="creditorDebt" value={formatCurrencyDigits(creditorDebt)} />
      <input type="hidden" name="otherLiabilities" value={formatCurrencyDigits(otherLiabilities)} />
      <input type="hidden" name="requestedAmount" value={formatCurrencyDigits(requestedAmount)} />
      <input type="hidden" name="propertyAddress" value={trimmedPropertyAddress} />
      <input type="hidden" name="propertyType" value={trimmedPropertyType} />
      <input type="hidden" name="borrowingEntityName" value={trimmedBorrowingEntityName} />
      <input type="hidden" name="bankruptcyHistory" value={bankruptcyHistory} />
      <input type="hidden" name="lawsuitHistory" value={lawsuitHistory} />
      <input type="hidden" name="judgmentHistory" value={judgmentHistory} />
      <input type="hidden" name="declarationNotes" value={declarationNotes.trim()} />
    </form>
  );
}
