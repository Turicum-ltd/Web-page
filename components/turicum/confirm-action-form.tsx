"use client";

import type { CSSProperties, ReactNode } from "react";

interface ConfirmActionFormProps {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ConfirmActionForm({
  action,
  confirmMessage,
  children,
  className,
  style
}: ConfirmActionFormProps) {
  return (
    <form
      action={action}
      className={className}
      style={style}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
