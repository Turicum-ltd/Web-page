import type { IntakeFormCode, IntakeFormResponse } from "@/lib/turicum/types";

export type IntakeFieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "textarea"
  | "currency"
  | "number"
  | "select"
  | "checkbox";

export interface IntakeFieldOption {
  value: string;
  label: string;
}

export interface IntakeFieldDefinition {
  name: string;
  label: string;
  type: IntakeFieldType;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: IntakeFieldOption[];
}

export interface IntakeFormSectionDefinition {
  title: string;
  description?: string;
  fields: IntakeFieldDefinition[];
}

export interface IntakeFormDefinition {
  code: IntakeFormCode;
  title: string;
  description: string;
  sourceDocumentLabel: string;
  signatureRequired: boolean;
  sections: IntakeFormSectionDefinition[];
}

const maritalStatusOptions: IntakeFieldOption[] = [
  { value: "married", label: "Married" },
  { value: "separated", label: "Separated" },
  { value: "unmarried", label: "Unmarried" }
];

const loanPurposeOptions: IntakeFieldOption[] = [
  { value: "purchase", label: "Purchase" },
  { value: "refinance", label: "Refinance" },
  { value: "refi_cash_out", label: "Refi cash-out" }
];

const entityOptions: IntakeFieldOption[] = [
  { value: "c_corp", label: "C-Corp" },
  { value: "s_corp", label: "S-Corp" },
  { value: "partnership", label: "Partnership" },
  { value: "proprietorship", label: "Proprietorship" },
  { value: "other", label: "Other" }
];

const businessTypeOptions: IntakeFieldOption[] = [
  { value: "retail", label: "Retail" },
  { value: "service", label: "Service" },
  { value: "wholesale", label: "Wholesale" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "construction", label: "Construction" },
  { value: "other", label: "Other" }
];

const trendOptions: IntakeFieldOption[] = [
  { value: "improving", label: "Improving" },
  { value: "stable", label: "Stable" },
  { value: "declining", label: "Declining" }
];

const intakeForms: IntakeFormDefinition[] = [
  {
    code: "commercial_loan_application",
    title: "Commercial loan application",
    description:
      "Borrower-facing intake form based on the anonymized commercial loan application. This should be completed directly by the borrower before underwriting.",
    sourceDocumentLabel: "Commercial-Loan-App_fillable.pdf",
    signatureRequired: false,
    sections: [
      {
        title: "Borrower profile",
        fields: [
          { name: "primaryBorrowerName", label: "Borrower name", type: "text", required: true },
          { name: "coBorrowerName", label: "Co-borrower name", type: "text" },
          { name: "primaryEmail", label: "Borrower email", type: "email", required: true },
          { name: "primaryCell", label: "Borrower cell phone", type: "tel" },
          {
            name: "primaryMaritalStatus",
            label: "Borrower marital status",
            type: "select",
            options: maritalStatusOptions
          },
          {
            name: "presentAddress",
            label: "Present address",
            type: "textarea",
            placeholder: "Street, city, state, zip"
          },
          {
            name: "formerAddress",
            label: "Former address",
            type: "textarea",
            placeholder: "Only if the borrower has not lived at the present address for 7 years"
          }
        ]
      },
      {
        title: "Employment and financial profile",
        fields: [
          { name: "employerName", label: "Employer or primary business", type: "text" },
          { name: "employerTitle", label: "Title or position", type: "text" },
          { name: "employerPhone", label: "Business phone", type: "tel" },
          { name: "yearsOnJob", label: "Years on this job", type: "number" },
          { name: "yearsInProfession", label: "Years in profession", type: "number" },
          {
            name: "personalIncomeAnnual",
            label: "Total annual personal income",
            type: "currency",
            placeholder: "$0"
          },
          {
            name: "personalExpensesAnnual",
            label: "Total annual personal expenses",
            type: "currency",
            placeholder: "$0"
          },
          {
            name: "declarationsSummary",
            label: "Declaration notes",
            type: "textarea",
            placeholder:
              "Explain any lawsuits, bankruptcies, foreclosure history, trust assets, or other declaration items."
          }
        ]
      },
      {
        title: "Property and loan request",
        fields: [
          {
            name: "requestedAmount",
            label: "Loan amount requested",
            type: "currency",
            placeholder: "$0"
          },
          {
            name: "loanPurpose",
            label: "Purpose",
            type: "select",
            options: loanPurposeOptions
          },
          { name: "propertyAddress", label: "Property address", type: "textarea" },
          { name: "county", label: "County", type: "text" },
          { name: "unitCount", label: "Number of units", type: "number" },
          { name: "propertyType", label: "Property type", type: "text" },
          {
            name: "purchasePrice",
            label: "Purchase price",
            type: "currency",
            placeholder: "$0"
          },
          {
            name: "cashOutUse",
            label: "Cash-out use or refinance notes",
            type: "textarea"
          }
        ]
      },
      {
        title: "Business and vesting details",
        fields: [
          {
            name: "vestingTitle",
            label: "Vesting of real estate title",
            type: "textarea",
            placeholder: "Exact names of individuals, form of title, or entity"
          },
          {
            name: "entityType",
            label: "Entity type",
            type: "select",
            options: entityOptions
          },
          {
            name: "businessType",
            label: "Business type",
            type: "select",
            options: businessTypeOptions
          },
          { name: "businessName", label: "Business name", type: "text" },
          { name: "primaryContactName", label: "Primary contact", type: "text" },
          { name: "businessPhone", label: "Business phone", type: "tel" },
          { name: "businessTaxId", label: "Business tax ID", type: "text" },
          { name: "website", label: "Website", type: "text" },
          {
            name: "natureOfBusiness",
            label: "Nature of business / products / services",
            type: "textarea"
          },
          {
            name: "revenueTrend",
            label: "Revenue trend",
            type: "select",
            options: trendOptions
          },
          {
            name: "profitabilityTrend",
            label: "Profitability trend",
            type: "select",
            options: trendOptions
          }
        ]
      }
    ]
  },
  {
    code: "guarantor_authorization",
    title: "Guarantor authorization to release information",
    description:
      "Borrower or guarantor acknowledgement based on the anonymized authorization form. This captures the guarantor identities and consent, then routes the formal signature request separately.",
    sourceDocumentLabel: "GHLLC_Guarantor-Authorization_FORM.pdf",
    signatureRequired: true,
    sections: [
      {
        title: "Guarantor details",
        fields: [
          { name: "guarantorOneName", label: "Guarantor 1 legal name", type: "text", required: true },
          { name: "guarantorTwoName", label: "Guarantor 2 legal name", type: "text" },
          {
            name: "authorizationConfirmed",
            label: "I authorize the lender and lender counsel to verify the information in my application and related records.",
            type: "checkbox",
            required: true
          },
          {
            name: "creditInvestigationConfirmed",
            label: "I understand this may include credit records, mortgage verification, title searches, and other due-diligence items described in the authorization.",
            type: "checkbox",
            required: true
          },
          { name: "submittedByName", label: "Name of person completing this step", type: "text" },
          { name: "submittedAt", label: "Date completed", type: "date" }
        ]
      }
    ]
  },
  {
    code: "lender_fee_agreement",
    title: "Lender fee agreement intake",
    description:
      "Pre-signature data capture based on the anonymized lender fee agreement / term sheet. Turicum LLC collects the borrower-confirmed deal terms here and then routes the formal signature request.",
    sourceDocumentLabel:
      "GHLLC_LFA_TBD-Entity_of_Shiwila-Willis-Jones_01-09-2025_GA_SFR.pdf",
    signatureRequired: true,
    sections: [
      {
        title: "Deal terms to confirm",
        fields: [
          { name: "borrowerEntity", label: "Borrower entity", type: "text", required: true },
          { name: "guarantorName", label: "Guarantor name", type: "text", required: true },
          { name: "subjectProperty", label: "Subject property", type: "textarea", required: true },
          { name: "county", label: "County", type: "text" },
          {
            name: "requestedLoanAmount",
            label: "Requested loan amount",
            type: "currency",
            placeholder: "$0"
          },
          {
            name: "indicativeRate",
            label: "Indicative rate",
            type: "text",
            placeholder: "14% estimated"
          },
          {
            name: "lenderFee",
            label: "Lender fee",
            type: "text",
            placeholder: "6%"
          },
          {
            name: "adminProcessingFee",
            label: "Admin processing fee",
            type: "currency",
            placeholder: "$1,995"
          },
          {
            name: "termMonths",
            label: "Term length (months)",
            type: "number",
            placeholder: "24"
          },
          {
            name: "commitmentFee",
            label: "Commitment fee",
            type: "currency",
            placeholder: "$1,240"
          }
        ]
      },
      {
        title: "Signer details",
        fields: [
          { name: "signerName", label: "Authorized signer", type: "text", required: true },
          { name: "signerCell", label: "Signer cell", type: "tel" },
          { name: "signerEmail", label: "Signer email", type: "email", required: true },
          {
            name: "termsReviewed",
            label: "I reviewed the preliminary loan terms, fee structure, and timing notes shown in this intake packet.",
            type: "checkbox",
            required: true
          },
          {
            name: "alternateStructuresAcknowledged",
            label: "I understand Turicum LLC may route the file into an alternate structure if underwriting or securitization requires it.",
            type: "checkbox"
          }
        ]
      }
    ]
  }
];

export function getIntakeForms() {
  return intakeForms;
}

export function getIntakeForm(code: IntakeFormCode) {
  return intakeForms.find((form) => form.code === code) ?? null;
}

export function getAssignedIntakeForms(codes: IntakeFormCode[]) {
  return codes
    .map((code) => getIntakeForm(code))
    .filter((item): item is IntakeFormDefinition => Boolean(item));
}

export function getIntakeFormFields(code: IntakeFormCode) {
  const definition = getIntakeForm(code);
  return definition?.sections.flatMap((section) => section.fields) ?? [];
}

export function collectIntakeFormResponse(
  formCode: IntakeFormCode,
  formData: FormData
): IntakeFormResponse {
  const fields = getIntakeFormFields(formCode);
  const response: IntakeFormResponse = {};

  for (const field of fields) {
    if (field.type === "checkbox") {
      response[field.name] = formData.get(field.name) === "on";
      continue;
    }

    response[field.name] = String(formData.get(field.name) ?? "").trim();
  }

  return response;
}

export function countAnsweredFields(
  definition: IntakeFormDefinition,
  response: IntakeFormResponse | undefined
) {
  if (!response) {
    return 0;
  }

  return definition.sections
    .flatMap((section) => section.fields)
    .filter((field) => {
      const value = response[field.name];

      if (field.type === "checkbox") {
        return value === true;
      }

      return typeof value === "string" && value.trim().length > 0;
    }).length;
}
