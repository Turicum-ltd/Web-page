"use client";

import { useState } from "react";

interface CommercialLoanApplicationFormProps {
  action: string;
}

type Step = 1 | 2 | 3 | 4;
type LoanPurpose = "purchase" | "refinance" | "refi_cash_out" | "";

interface OwnershipRow {
  id: string;
  name: string;
  title: string;
  percentOwned: string;
}

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
  | "constructionType"
  | "purpose"
  | "purchasePrice"
  | "sourceOfDownPayment"
  | "yearAcquired"
  | "originalCost"
  | "existingLiens"
  | "estimatedPresentValue"
  | "exactNameOfEntityForTitle"
  | "entityType"
  | "businessTaxId"
  | "dateEstablished"
  | "numberOfEmployees"
  | "primaryBusinessAddress"
  | "bankruptcyHistory"
  | "lawsuitHistory"
  | "judgmentHistory"
  | "declarationNotes";

const propertyTypeOptions = [
  "Industrial",
  "Retail",
  "Office",
  "Mixed-Use",
  "Multifamily",
  "Hospitality",
  "Land",
  "Other"
];

const constructionTypeOptions = [
  "Steel",
  "Concrete",
  "Wood Frame",
  "Tilt-Up",
  "Masonry",
  "Other"
];

const entityTypeOptions = ["C-Corp", "S-Corp", "Partnership", "LLC", "Other"];

const declarationOptions = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" }
];

const purposeOptions: Array<{ value: Exclude<LoanPurpose, "">; label: string }> = [
  { value: "purchase", label: "Purchase" },
  { value: "refinance", label: "Refinance" },
  { value: "refi_cash_out", label: "Refi-Cash Out" }
];

function createOwnershipRow(): OwnershipRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    title: "",
    percentOwned: ""
  };
}

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

function normalizePercentInput(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : whole;
}

function parsePercent(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function CommercialLoanApplicationForm({ action }: CommercialLoanApplicationFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [ownershipTouched, setOwnershipTouched] = useState(false);
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
    constructionType: false,
    purpose: false,
    purchasePrice: false,
    sourceOfDownPayment: false,
    yearAcquired: false,
    originalCost: false,
    existingLiens: false,
    estimatedPresentValue: false,
    exactNameOfEntityForTitle: false,
    entityType: false,
    businessTaxId: false,
    dateEstablished: false,
    numberOfEmployees: false,
    primaryBusinessAddress: false,
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
  const [constructionType, setConstructionType] = useState("");
  const [purpose, setPurpose] = useState<LoanPurpose>("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sourceOfDownPayment, setSourceOfDownPayment] = useState("");
  const [yearAcquired, setYearAcquired] = useState("");
  const [originalCost, setOriginalCost] = useState("");
  const [existingLiens, setExistingLiens] = useState("");
  const [estimatedPresentValue, setEstimatedPresentValue] = useState("");
  const [exactNameOfEntityForTitle, setExactNameOfEntityForTitle] = useState("");
  const [entityType, setEntityType] = useState("");
  const [ownershipRows, setOwnershipRows] = useState<OwnershipRow[]>([createOwnershipRow()]);
  const [businessTaxId, setBusinessTaxId] = useState("");
  const [dateEstablished, setDateEstablished] = useState("");
  const [numberOfEmployees, setNumberOfEmployees] = useState("");
  const [primaryBusinessAddress, setPrimaryBusinessAddress] = useState("");
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
  const trimmedConstructionType = constructionType.trim();
  const trimmedExactNameOfEntityForTitle = exactNameOfEntityForTitle.trim();
  const trimmedEntityType = entityType.trim();
  const trimmedBusinessTaxId = businessTaxId.trim();
  const trimmedDateEstablished = dateEstablished.trim();
  const trimmedNumberOfEmployees = numberOfEmployees.trim();
  const trimmedPrimaryBusinessAddress = primaryBusinessAddress.trim();
  const activeOwnershipRows = ownershipRows.filter(
    (row) => row.name.trim() || row.title.trim() || row.percentOwned.trim()
  );
  const ownershipRowsComplete =
    activeOwnershipRows.length > 0 &&
    activeOwnershipRows.every(
      (row) => row.name.trim() && row.title.trim() && row.percentOwned.trim()
    );
  const ownershipTotal = activeOwnershipRows.reduce(
    (sum, row) => sum + parsePercent(row.percentOwned.trim()),
    0
  );
  const ownershipTotalValid = ownershipTotal <= 100;
  const purchasePurpose = purpose === "purchase";
  const refinancePurpose = purpose === "refinance" || purpose === "refi_cash_out";

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
    trimmedConstructionType.length > 0 &&
    purpose.length > 0 &&
    estimatedPresentValue.length > 0 &&
    trimmedExactNameOfEntityForTitle.length > 0 &&
    trimmedEntityType.length > 0 &&
    trimmedBusinessTaxId.length > 0 &&
    trimmedDateEstablished.length > 0 &&
    trimmedNumberOfEmployees.length > 0 &&
    trimmedPrimaryBusinessAddress.length > 0 &&
    ownershipRowsComplete &&
    ownershipTotalValid &&
    (!purchasePurpose || (purchasePrice.length > 0 && sourceOfDownPayment.trim().length > 0)) &&
    (!refinancePurpose || (yearAcquired.trim().length > 0 && originalCost.length > 0 && existingLiens.length > 0));
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
      constructionType: !trimmedConstructionType,
      purpose: !purpose,
      estimatedPresentValue: !estimatedPresentValue,
      exactNameOfEntityForTitle: !trimmedExactNameOfEntityForTitle,
      entityType: !trimmedEntityType,
      businessTaxId: !trimmedBusinessTaxId,
      dateEstablished: !trimmedDateEstablished,
      numberOfEmployees: !trimmedNumberOfEmployees,
      primaryBusinessAddress: !trimmedPrimaryBusinessAddress,
      bankruptcyHistory: !bankruptcyHistory,
      lawsuitHistory: !lawsuitHistory,
      judgmentHistory: !judgmentHistory,
      purchasePrice: purchasePurpose && !purchasePrice,
      sourceOfDownPayment: purchasePurpose && !sourceOfDownPayment.trim(),
      yearAcquired: refinancePurpose && !yearAcquired.trim(),
      originalCost: refinancePurpose && !originalCost,
      existingLiens: refinancePurpose && !existingLiens
    };

    if (requiredMap[field]) {
      return "Required";
    }

    return null;
  }

  function updateOwnershipRow(rowId: string, field: keyof Omit<OwnershipRow, "id">, value: string) {
    setOwnershipRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: field === "percentOwned" ? normalizePercentInput(value) : value
            }
          : row
      )
    );
  }

  function addOwnershipRow() {
    setOwnershipRows((current) => [...current, createOwnershipRow()]);
  }

  function removeOwnershipRow(rowId: string) {
    setOwnershipRows((current) =>
      current.length === 1 ? current.map((row) => ({ ...row, name: "", title: "", percentOwned: "" })) : current.filter((row) => row.id !== rowId)
    );
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
        "constructionType",
        "purpose",
        "purchasePrice",
        "sourceOfDownPayment",
        "yearAcquired",
        "originalCost",
        "existingLiens",
        "estimatedPresentValue",
        "exactNameOfEntityForTitle",
        "entityType",
        "businessTaxId",
        "dateEstablished",
        "numberOfEmployees",
        "primaryBusinessAddress"
      ]);
      setOwnershipTouched(true);
      if (!stepThreeValid) {
        return;
      }
      setStep(4);
    }
  }

  const ownershipError = ownershipTouched
    ? !activeOwnershipRows.length
      ? "Add at least one owner or officer."
      : !ownershipRowsComplete
        ? "Complete each ownership row."
        : !ownershipTotalValid
          ? "Ownership total cannot exceed 100%."
          : null
    : null;

  return (
    <form className="form-grid turicum-intro-call-form" method="post" action={action}>
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
            <strong>Property & Entity</strong>
            <span>Collateral, vesting, business data</span>
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
              <input inputMode="numeric" placeholder="250,000" value={formatCurrencyDigits(annualIncome)} onChange={(e) => setAnnualIncome(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("annualIncome")} />
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
            <h3>Property & Entity</h3>
            <p className="helper">Capture the property to be financed, title vesting, ownership, and core business details in one diligence-ready step.</p>
          </div>

          <div className="turicum-application-section-card">
            <div className="turicum-application-section-head">
              <p className="eyebrow">Property to be financed</p>
              <h4>Collateral and request details</h4>
            </div>
            <div className="turicum-intro-stage-grid turicum-application-property-grid">
              <label className={`${fieldClassName("propertyAddress")} turicum-application-span-full`}>
                <span>Property address</span>
                <textarea value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} onBlur={() => handleBlur("propertyAddress")} rows={3} />
                {getFieldError("propertyAddress") ? <small className="turicum-field-error">{getFieldError("propertyAddress")}</small> : null}
              </label>
              <label className={fieldClassName("propertyType")}>
                <span>Type</span>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} onBlur={() => handleBlur("propertyType")}>
                  <option value="">Select type</option>
                  {propertyTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {getFieldError("propertyType") ? <small className="turicum-field-error">{getFieldError("propertyType")}</small> : null}
              </label>
              <label className={fieldClassName("constructionType")}>
                <span>Construction type</span>
                <select value={constructionType} onChange={(e) => setConstructionType(e.target.value)} onBlur={() => handleBlur("constructionType")}>
                  <option value="">Select type</option>
                  {constructionTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {getFieldError("constructionType") ? <small className="turicum-field-error">{getFieldError("constructionType")}</small> : null}
              </label>
              <div className={`field turicum-purpose-field${getFieldError("purpose") ? " is-invalid" : ""}`}>
                <span>Purpose</span>
                <div className="turicum-purpose-toggle-row">
                  {purposeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`turicum-purpose-toggle${purpose === option.value ? " is-active" : ""}`}
                      onClick={() => {
                        setPurpose(option.value);
                        setTouched((current) => ({ ...current, purpose: true }));
                      }}
                      aria-pressed={purpose === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {getFieldError("purpose") ? <small className="turicum-field-error">{getFieldError("purpose")}</small> : null}
              </div>
              {purchasePurpose ? (
                <>
                  <label className={fieldClassName("purchasePrice")}>
                    <span>Purchase price</span>
                    <input inputMode="numeric" value={formatCurrencyDigits(purchasePrice)} onChange={(e) => setPurchasePrice(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("purchasePrice")} />
                    {getFieldError("purchasePrice") ? <small className="turicum-field-error">{getFieldError("purchasePrice")}</small> : null}
                  </label>
                  <label className={fieldClassName("sourceOfDownPayment")}>
                    <span>Source of down payment</span>
                    <input value={sourceOfDownPayment} onChange={(e) => setSourceOfDownPayment(e.target.value)} onBlur={() => handleBlur("sourceOfDownPayment")} />
                    {getFieldError("sourceOfDownPayment") ? <small className="turicum-field-error">{getFieldError("sourceOfDownPayment")}</small> : null}
                  </label>
                </>
              ) : null}
              {refinancePurpose ? (
                <>
                  <label className={fieldClassName("yearAcquired")}>
                    <span>Year acquired</span>
                    <input value={yearAcquired} onChange={(e) => setYearAcquired(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} onBlur={() => handleBlur("yearAcquired")} placeholder="2019" />
                    {getFieldError("yearAcquired") ? <small className="turicum-field-error">{getFieldError("yearAcquired")}</small> : null}
                  </label>
                  <label className={fieldClassName("originalCost")}>
                    <span>Original cost</span>
                    <input inputMode="numeric" value={formatCurrencyDigits(originalCost)} onChange={(e) => setOriginalCost(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("originalCost")} />
                    {getFieldError("originalCost") ? <small className="turicum-field-error">{getFieldError("originalCost")}</small> : null}
                  </label>
                  <label className={`${fieldClassName("existingLiens")} turicum-application-span-full`}>
                    <span>Existing liens</span>
                    <textarea value={existingLiens} onChange={(e) => setExistingLiens(e.target.value)} onBlur={() => handleBlur("existingLiens")} rows={3} />
                    {getFieldError("existingLiens") ? <small className="turicum-field-error">{getFieldError("existingLiens")}</small> : null}
                  </label>
                </>
              ) : null}
              <label className={fieldClassName("requestedAmount")}>
                <span>Amount requested</span>
                <input inputMode="numeric" value={formatCurrencyDigits(requestedAmount)} onChange={(e) => setRequestedAmount(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("requestedAmount")} />
                {getFieldError("requestedAmount") ? <small className="turicum-field-error">{getFieldError("requestedAmount")}</small> : null}
              </label>
              <label className={fieldClassName("estimatedPresentValue")}>
                <span>Estimated present value</span>
                <input inputMode="numeric" value={formatCurrencyDigits(estimatedPresentValue)} onChange={(e) => setEstimatedPresentValue(normalizeCurrencyInput(e.target.value))} onBlur={() => handleBlur("estimatedPresentValue")} />
                {getFieldError("estimatedPresentValue") ? <small className="turicum-field-error">{getFieldError("estimatedPresentValue")}</small> : null}
              </label>
            </div>
          </div>

          <div className="turicum-application-section-card">
            <div className="turicum-application-section-head">
              <p className="eyebrow">Vesting & entity</p>
              <h4>Title vesting and ownership</h4>
            </div>
            <div className="turicum-intro-stage-grid turicum-application-entity-grid">
              <label className={`${fieldClassName("exactNameOfEntityForTitle")} turicum-application-span-full`}>
                <span>Exact name of entity for title</span>
                <input value={exactNameOfEntityForTitle} onChange={(e) => setExactNameOfEntityForTitle(e.target.value)} onBlur={() => handleBlur("exactNameOfEntityForTitle")} />
                {getFieldError("exactNameOfEntityForTitle") ? <small className="turicum-field-error">{getFieldError("exactNameOfEntityForTitle")}</small> : null}
              </label>
              <label className={fieldClassName("entityType")}>
                <span>Entity type</span>
                <select value={entityType} onChange={(e) => setEntityType(e.target.value)} onBlur={() => handleBlur("entityType")}>
                  <option value="">Select entity type</option>
                  {entityTypeOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {getFieldError("entityType") ? <small className="turicum-field-error">{getFieldError("entityType")}</small> : null}
              </label>
            </div>
            <div className="turicum-ownership-shell">
              <div className="turicum-ownership-head">
                <div>
                  <p className="eyebrow">Ownership table</p>
                  <p className="helper">List every director, officer, or ownership stakeholder tied to the vesting entity.</p>
                </div>
                <button type="button" className="secondary-button" onClick={addOwnershipRow}>
                  Add owner
                </button>
              </div>
              <div className="turicum-ownership-table">
                <div className="turicum-ownership-table-head">
                  <span>Name</span>
                  <span>Title</span>
                  <span>% Owned</span>
                  <span aria-hidden="true" />
                </div>
                {ownershipRows.map((row) => (
                  <div key={row.id} className="turicum-ownership-table-row">
                    <input value={row.name} onChange={(e) => updateOwnershipRow(row.id, "name", e.target.value)} onBlur={() => setOwnershipTouched(true)} placeholder="Jane Doe" />
                    <input value={row.title} onChange={(e) => updateOwnershipRow(row.id, "title", e.target.value)} onBlur={() => setOwnershipTouched(true)} placeholder="Managing Member" />
                    <input value={row.percentOwned} onChange={(e) => updateOwnershipRow(row.id, "percentOwned", e.target.value)} onBlur={() => setOwnershipTouched(true)} inputMode="decimal" placeholder="50" />
                    <button type="button" className="secondary-button turicum-ownership-remove" onClick={() => removeOwnershipRow(row.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="turicum-ownership-summary">
                <span>Total ownership entered: {ownershipTotal.toFixed(2).replace(/\.00$/, "")}%</span>
                {ownershipError ? <small className="turicum-field-error">{ownershipError}</small> : null}
              </div>
            </div>
          </div>

          <div className="turicum-application-section-card">
            <div className="turicum-application-section-head">
              <p className="eyebrow">Business data</p>
              <h4>Operating business details</h4>
            </div>
            <div className="turicum-intro-stage-grid turicum-application-business-grid">
              <label className={fieldClassName("businessTaxId")}>
                <span>Business Tax ID (EIN)</span>
                <input value={businessTaxId} onChange={(e) => setBusinessTaxId(e.target.value)} onBlur={() => handleBlur("businessTaxId")} />
                {getFieldError("businessTaxId") ? <small className="turicum-field-error">{getFieldError("businessTaxId")}</small> : null}
              </label>
              <label className={fieldClassName("dateEstablished")}>
                <span>Date established</span>
                <input type="date" value={dateEstablished} onChange={(e) => setDateEstablished(e.target.value)} onBlur={() => handleBlur("dateEstablished")} />
                {getFieldError("dateEstablished") ? <small className="turicum-field-error">{getFieldError("dateEstablished")}</small> : null}
              </label>
              <label className={fieldClassName("numberOfEmployees")}>
                <span>Number of employees</span>
                <input inputMode="numeric" value={numberOfEmployees} onChange={(e) => setNumberOfEmployees(e.target.value.replace(/[^0-9]/g, ""))} onBlur={() => handleBlur("numberOfEmployees")} />
                {getFieldError("numberOfEmployees") ? <small className="turicum-field-error">{getFieldError("numberOfEmployees")}</small> : null}
              </label>
              <label className={`${fieldClassName("primaryBusinessAddress")} turicum-application-span-full`}>
                <span>Primary business address</span>
                <textarea value={primaryBusinessAddress} onChange={(e) => setPrimaryBusinessAddress(e.target.value)} onBlur={() => handleBlur("primaryBusinessAddress")} rows={3} />
                {getFieldError("primaryBusinessAddress") ? <small className="turicum-field-error">{getFieldError("primaryBusinessAddress")}</small> : null}
              </label>
            </div>
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
      <input type="hidden" name="constructionType" value={trimmedConstructionType} />
      <input type="hidden" name="purpose" value={purpose} />
      <input type="hidden" name="purchasePrice" value={formatCurrencyDigits(purchasePrice)} />
      <input type="hidden" name="sourceOfDownPayment" value={sourceOfDownPayment.trim()} />
      <input type="hidden" name="yearAcquired" value={yearAcquired.trim()} />
      <input type="hidden" name="originalCost" value={formatCurrencyDigits(originalCost)} />
      <input type="hidden" name="existingLiens" value={existingLiens.trim()} />
      <input type="hidden" name="estimatedPresentValue" value={formatCurrencyDigits(estimatedPresentValue)} />
      <input type="hidden" name="exactNameOfEntityForTitle" value={trimmedExactNameOfEntityForTitle} />
      <input type="hidden" name="borrowingEntityName" value={trimmedExactNameOfEntityForTitle} />
      <input type="hidden" name="entityType" value={trimmedEntityType} />
      <input type="hidden" name="ownershipTable" value={JSON.stringify(activeOwnershipRows.map((row) => ({ name: row.name.trim(), title: row.title.trim(), percentOwned: row.percentOwned.trim() })))} />
      <input type="hidden" name="businessTaxId" value={trimmedBusinessTaxId} />
      <input type="hidden" name="dateEstablished" value={trimmedDateEstablished} />
      <input type="hidden" name="numberOfEmployees" value={trimmedNumberOfEmployees} />
      <input type="hidden" name="primaryBusinessAddress" value={trimmedPrimaryBusinessAddress} />
      <input type="hidden" name="bankruptcyHistory" value={bankruptcyHistory} />
      <input type="hidden" name="lawsuitHistory" value={lawsuitHistory} />
      <input type="hidden" name="judgmentHistory" value={judgmentHistory} />
      <input type="hidden" name="declarationNotes" value={declarationNotes.trim()} />
    </form>
  );
}
