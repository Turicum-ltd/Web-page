"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

interface DocumentTypeOption {
  code: string;
  label: string;
}

interface DocumentActionState {
  status: "idle" | "success" | "error";
  message: string;
  mode: "drive" | "upload";
}

interface CaseDocumentIntakeProps {
  documentTypes: DocumentTypeOption[];
  action: (state: DocumentActionState, formData: FormData) => Promise<DocumentActionState>;
}

const INITIAL_STATE: DocumentActionState = {
  status: "idle",
  message: "",
  mode: "drive"
};

const CATEGORY_OPTIONS = [
  { value: "core_legal", label: "Core Legal" },
  { value: "closing_settlement", label: "Closing - Settlement" },
  { value: "title_recorded", label: "Title - Recorded" },
  { value: "entity_jv", label: "Entity - JV" },
  { value: "funding_escrow", label: "Funding - Escrow" },
  { value: "insurance_support", label: "Insurance - Support" },
  { value: "market_data", label: "Photos - Market Data" },
  { value: "archive", label: "Archive" }
] as const;

const STATUS_OPTIONS = ["uploaded", "under_review", "approved", "signed", "recorded", "final"] as const;

function SubmitButton({ mode }: { mode: "drive" | "upload" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : mode === "drive" ? "Link Google Drive document" : "Upload document"}
    </button>
  );
}

export function CaseDocumentIntake({ documentTypes, action }: CaseDocumentIntakeProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<"drive" | "upload">("drive");
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.mode !== mode) {
      setMode(state.mode);
    }
  }, [mode, state.mode]);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.status]);

  const modeCopy = useMemo(
    () =>
      mode === "drive"
        ? {
            title: "Reference a Drive file already in place",
            helper:
              "Use this when the borrower packet already lives in Google Drive. Turicum will store a controlled Drive reference, not an arbitrary external link."
          }
        : {
            title: "Upload the file directly into Turicum",
            helper:
              "Use this for files that are still local to your machine or came in by email and need to be added to the case now."
          },
    [mode]
  );

  return (
    <div className="form-grid">
      <div className="pill-row">
        <button
          type="button"
          className={mode === "drive" ? "secondary-button is-active" : "secondary-button"}
          onClick={() => setMode("drive")}
        >
          Google Drive
        </button>
        <button
          type="button"
          className={mode === "upload" ? "secondary-button is-active" : "secondary-button"}
          onClick={() => setMode("upload")}
        >
          Direct upload
        </button>
      </div>

      <div className="callout">
        <p className="eyebrow">Current mode</p>
        <p><strong>{modeCopy.title}</strong></p>
        <p className="helper">{modeCopy.helper}</p>
      </div>

      {state.status !== "idle" ? (
        <div className={state.status === "error" ? "callout turicum-form-callout-error" : "callout turicum-form-callout-success"}>
          <p className="eyebrow">{state.status === "error" ? "Document intake needs attention" : "Document saved"}</p>
          <p>{state.message}</p>
        </div>
      ) : null}

      <form ref={formRef} action={formAction} className="form-grid">
        <input type="hidden" name="entryMode" value={mode} />

        <label className="field">
          <span>Document Type</span>
          <select name="documentTypeCode" defaultValue="closing_statement">
            {documentTypes.map((documentType) => (
              <option key={documentType.code} value={documentType.code}>
                {documentType.label}
              </option>
            ))}
          </select>
        </label>

        <div className="two-up">
          <label className="field">
            <span>Category</span>
            <select name="category" defaultValue="core_legal">
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue="uploaded">
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {mode === "drive" ? (
          <>
            <label className="field">
              <span>Google Drive Link</span>
              <input name="driveUrl" type="url" placeholder="https://drive.google.com/..." required />
            </label>

            <div className="two-up">
              <label className="field">
                <span>Display Title</span>
                <input name="title" type="text" placeholder="Optional title shown in Turicum" />
              </label>

              <label className="field">
                <span>File Label</span>
                <input name="fileName" type="text" placeholder="Optional file name label" />
              </label>
            </div>
          </>
        ) : (
          <label className="field">
            <span>File</span>
            <input name="file" type="file" required />
          </label>
        )}

        <div className="form-actions">
          <SubmitButton mode={mode} />
        </div>
      </form>
    </div>
  );
}
