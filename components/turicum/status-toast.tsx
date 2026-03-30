"use client";

import { useEffect, useState } from "react";

interface StatusToastProps {
  show: boolean;
  tone?: "success" | "error";
  title: string;
  message: string;
}

export function StatusToast({
  show,
  tone = "success",
  title,
  message
}: StatusToastProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);

    if (!show) {
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [show]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`turicum-status-toast ${tone === "error" ? "is-error" : "is-success"}`}
      role="status"
      aria-live="polite"
    >
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}
