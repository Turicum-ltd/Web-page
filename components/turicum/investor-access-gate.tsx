"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/turicum/runtime";

function InvestorAccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="turicum-underwriting-modal-backdrop" onClick={onClose}>
      <div
        className="turicum-underwriting-modal turicum-gatekeeper-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="turicum-gatekeeper-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="turicum-underwriting-modal-head turicum-gatekeeper-modal-head">
          <div>
            <p className="eyebrow">Investor Access</p>
            <h3 id="turicum-gatekeeper-modal-title">Open the investor lane.</h3>
            <p className="helper">
              Live opportunities and underwriting-room access stay behind a partner gate.
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="turicum-underwriting-modal-grid turicum-gatekeeper-modal-grid">
          <article className="turicum-underwriting-modal-card turicum-gatekeeper-card">
            <p className="eyebrow">Existing partner</p>
            <h4>Partner Login</h4>
            <p className="helper">
              Enter the secure investor portal to review current opportunities and portfolio reporting.
            </p>
            <Link className="secondary-button turicum-primary-button" href={withBasePath("/investors#signin")} onClick={onClose}>
              Partner Login
            </Link>
          </article>

          <article className="turicum-underwriting-modal-card turicum-gatekeeper-card">
            <p className="eyebrow">New relationship</p>
            <h4>Request Access</h4>
            <p className="helper">
              Request the partnership deck and complete the suitability screen before portal credentials are issued.
            </p>
            <Link className="secondary-button" href={withBasePath("/investors#request-access")} onClick={onClose}>
              Request Access
            </Link>
          </article>
        </div>
      </div>
    </div>
  );
}

export function InvestorAccessGate({
  label,
  className,
  triggerId
}: {
  label: string;
  className?: string;
  triggerId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button id={triggerId} type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <InvestorAccessModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
