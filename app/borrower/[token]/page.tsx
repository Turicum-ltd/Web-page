import { notFound, redirect } from "next/navigation";
import { getCaseById } from "@/lib/atlas/cases";
import { withBasePath } from "@/lib/atlas/runtime";
import {
  collectIntakeFormResponse,
  countAnsweredFields,
  getAssignedIntakeForms,
  type IntakeFieldDefinition,
  type IntakeFormDefinition
} from "@/lib/atlas/intake-forms";
import {
  getBorrowerPortalByToken,
  getBorrowerPortalNextSteps,
  getBorrowerPortalSummary,
  getFormProgressSummary,
  getSignatureRequestsForForm,
  submitBorrowerPortalForm
} from "@/lib/atlas/intake";
import type { IntakeFormCode, IntakeFormResponse } from "@/lib/atlas/types";

export const dynamic = "force-dynamic";

function normalizeIntakeFormCode(value: FormDataEntryValue | null): IntakeFormCode {
  return value === "guarantor_authorization" || value === "lender_fee_agreement"
    ? value
    : "commercial_loan_application";
}

function renderField(field: IntakeFieldDefinition, response: IntakeFormResponse | undefined) {
  const value = response?.[field.name];

  if (field.type === "checkbox") {
    return (
      <label key={field.name} className="checkbox-item">
        <input type="checkbox" name={field.name} defaultChecked={value === true} />
        <span>
          <strong>{field.label}</strong>
          {field.helpText ? <small>{field.helpText}</small> : null}
        </span>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label key={field.name} className="field">
        <span>{field.label}</span>
        <textarea
          name={field.name}
          rows={4}
          defaultValue={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          required={field.required}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label key={field.name} className="field">
        <span>{field.label}</span>
        <select name={field.name} defaultValue={typeof value === "string" ? value : ""}>
          <option value="">Select an option</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  const inputType =
    field.type === "currency"
      ? "text"
      : field.type === "number"
        ? "number"
        : field.type;

  return (
    <label key={field.name} className="field">
      <span>{field.label}</span>
      <input
        name={field.name}
        type={inputType}
        defaultValue={typeof value === "string" ? value : ""}
        placeholder={field.placeholder}
        required={field.required}
        inputMode={field.type === "currency" ? "decimal" : undefined}
      />
    </label>
  );
}

function BorrowerFormCard({
  definition,
  response,
  token,
  signatureSummary
}: {
  definition: IntakeFormDefinition;
  response: IntakeFormResponse | undefined;
  token: string;
  signatureSummary: string | null;
}) {
  const answeredCount = countAnsweredFields(definition, response);
  const totalFields = definition.sections.flatMap((section) => section.fields).length;

  async function submitForm(formData: FormData) {
    "use server";

    const formCode = normalizeIntakeFormCode(formData.get("formCode"));
    await submitBorrowerPortalForm(token, formCode, collectIntakeFormResponse(formCode, formData));
    redirect(withBasePath(`/borrower/${token}`));
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">{definition.sourceDocumentLabel}</p>
          <h2>{definition.title}</h2>
        </div>
        <span className={`badge ${answeredCount > 0 ? "production" : "optional"}`}>
          {answeredCount}/{totalFields} answered
        </span>
      </div>
      <p>{definition.description}</p>
      {signatureSummary ? (
        <div className="callout">
          <p className="eyebrow">Signature status</p>
          <p>{signatureSummary}</p>
        </div>
      ) : definition.signatureRequired ? (
        <p className="helper">
          A formal signature request will be sent separately after Turicum LLC reviews the intake details.
        </p>
      ) : null}

      <form action={submitForm} className="form-grid">
        <input type="hidden" name="formCode" value={definition.code} />
        {definition.sections.map((section) => (
          <div key={section.title} className="subpanel">
            <div className="stack-sm">
              <h3>{section.title}</h3>
              {section.description ? <p className="helper">{section.description}</p> : null}
            </div>
            <div className="form-grid">
              {section.fields.map((field) => renderField(field, response))}
            </div>
          </div>
        ))}
        <div className="form-actions">
          <button type="submit">Save {definition.title}</button>
        </div>
      </form>
    </section>
  );
}

export default async function BorrowerPortalPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const portal = await getBorrowerPortalByToken(token);

  if (!portal) {
    notFound();
  }

  const caseItem = await getCaseById(portal.caseId);

  if (!caseItem) {
    notFound();
  }

  const forms = getAssignedIntakeForms(portal.assignedForms);
  const summary = getBorrowerPortalSummary(portal);
  const nextSteps = getBorrowerPortalNextSteps(portal);
  const allSignatureRequests = forms.flatMap((form) => getSignatureRequestsForForm(portal, form.code));
  const activeSignatureRequest = allSignatureRequests.find((request) => request.status !== "signed") ?? allSignatureRequests[0] ?? null;

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Borrower Portal</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>{portal.portalTitle}</h1>
              <p>
                Complete the assigned intake steps for {caseItem.title}. Turicum LLC will guide you through the
                information request first, then show any documents that are ready for signature after review.
              </p>
            </div>
            <div className="hero-aside">
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Case</p>
                  <strong>{caseItem.code}</strong>
                  <p className="helper">your active file</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">State</p>
                  <strong>{caseItem.state}</strong>
                  <p className="helper">deal jurisdiction</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Structure</p>
                  <strong>{caseItem.structureType}</strong>
                  <p className="helper">deal type</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Completed</p>
                  <strong>{summary.submittedForms}/{summary.totalForms}</strong>
                  <p className="helper">assigned forms saved</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="two-up">
          <div className="panel lead">
            <p className="eyebrow">Progress</p>
            <h2>Here’s what remains in your packet</h2>
            <div className="progress-shell">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round(summary.completionRatio * 100)}%` }}
                />
              </div>
              <p className="helper">
                {summary.submittedForms} of {summary.totalForms} assigned form(s) saved.
              </p>
            </div>
            <ul className="list">
              {nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <p className="eyebrow">Document Status</p>
            <h2>What is ready for signature</h2>
            {activeSignatureRequest ? (
              <>
                <div className="dashboard-band">
                  <div className="band-card">
                    <p className="eyebrow">Current document</p>
                    <strong>{activeSignatureRequest.title}</strong>
                    <p className="helper">next signature-bearing item</p>
                  </div>
                  <div className="band-card">
                    <p className="eyebrow">Status</p>
                    <strong>{activeSignatureRequest.status.replaceAll("_", " ")}</strong>
                    <p className="helper">{activeSignatureRequest.provider.replaceAll("_", " ")}</p>
                  </div>
                </div>
                <p className="helper">
                  Your lender team prepares and reviews documents before they are sent for signature. Once
                  a document is ready, Turicum LLC will show its status here and route you to the signature request separately.
                </p>
              </>
            ) : (
              <div className="callout">
                <p className="eyebrow">No signature request yet</p>
                <p>
                  Turicum LLC is still gathering intake details. Signature-bearing documents will appear here
                  after internal review.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Assigned Forms</p>
              <h2>Complete the current packet</h2>
            </div>
            <p className="page-note helper">
              Save each form as you go. Turicum LLC keeps your progress and will unlock the signature path only after the lender-side review is complete.
            </p>
          </div>
          <div className="status-grid">
          {forms.map((form) => {
            const progress = getFormProgressSummary(portal, form.code);
            return (
              <article key={form.code} className="status-card">
                <p className="eyebrow">{form.sourceDocumentLabel}</p>
                <h3>{form.title}</h3>
                <p className="helper">{progress.answeredCount} of {progress.totalFields} fields answered</p>
              </article>
            );
          })}
          </div>
        </section>

        {forms.map((form) => {
          const signatureRequests = getSignatureRequestsForForm(portal, form.code);
          const signatureSummary =
            signatureRequests.length > 0
              ? `${signatureRequests[0].status.replaceAll("_", " ")} via ${signatureRequests[0].provider.replaceAll("_", " ")}`
              : null;

          return (
            <BorrowerFormCard
              key={form.code}
              definition={form}
              response={portal.formResponses[form.code]}
              token={token}
              signatureSummary={signatureSummary}
            />
          );
        })}
      </div>
    </main>
  );
}
