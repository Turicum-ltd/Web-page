"use client";

import { useMemo, useState, useTransition } from "react";
import { StatusToast } from "@/components/turicum/status-toast";

interface InvestorGrantCaseOption {
  id: string;
  code: string;
  title: string;
  stage: string;
}

interface SaveInvestorGrantResult {
  ok: boolean;
  count?: number;
  email?: string;
  message?: string;
}

interface InvestorGrantFormProps {
  cases: InvestorGrantCaseOption[];
  defaultCaseId?: string;
  saveInvestorGrant: (formData: FormData) => Promise<SaveInvestorGrantResult>;
}

export function InvestorGrantForm({
  cases,
  defaultCaseId,
  saveInvestorGrant
}: InvestorGrantFormProps) {
  const [email, setEmail] = useState("");
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>(defaultCaseId ? [defaultCaseId] : []);
  const [toast, setToast] = useState<{
    key: number;
    tone: "success" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCount = selectedCaseIds.length;

  const toastView = useMemo(() => {
    if (!toast) {
      return null;
    }

    return (
      <StatusToast
        key={toast.key}
        show
        tone={toast.tone}
        title={toast.title}
        message={toast.message}
      />
    );
  }, [toast]);

  function toggleCase(caseId: string, checked: boolean) {
    setSelectedCaseIds((current) => {
      if (checked) {
        return current.includes(caseId) ? current : [...current, caseId];
      }

      return current.filter((item) => item !== caseId);
    });
  }

  function showToast(tone: "success" | "error", title: string, message: string) {
    setToast({
      key: Date.now(),
      tone,
      title,
      message
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !selectedCaseIds.length) {
      showToast("error", "Grant failed", "Enter an investor email and select at least one case.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", normalizedEmail);

      for (const caseId of selectedCaseIds) {
        formData.append("caseIds", caseId);
      }

      const result = await saveInvestorGrant(formData);

      if (!result.ok || !result.count || !result.email) {
        showToast(
          "error",
          "Grant failed",
          result.message ?? "Investor case access could not be saved."
        );
        return;
      }

      showToast(
        "success",
        "Success",
        `Access granted to ${result.count} cases for ${result.email}.`
      );
    });
  }

  return (
    <>
      {toastView}
      <form onSubmit={handleSubmit} className="form-grid">
        <label className="field">
          <span>Investor email</span>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <div className="field">
          <span>Cases</span>
          <div className="checkbox-grid">
            {cases.map((item) => (
              <label key={item.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedCaseIds.includes(item.id)}
                  onChange={(event) => toggleCase(item.id, event.target.checked)}
                />
                <span>
                  <strong>{item.code}</strong>
                  <small>
                    {item.title} · {item.stage.replaceAll("_", " ")}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isPending || selectedCount === 0}>
            {isPending ? "Granting access..." : "Grant investor access"}
          </button>
          <span className="helper">
            {selectedCount} {selectedCount === 1 ? "case" : "cases"} selected
          </span>
        </div>
      </form>
    </>
  );
}
