"use client";

import { useState } from "react";

interface GeneratedPasswordFieldProps {
  name: string;
  label: string;
  required?: boolean;
}

function generatePassword() {
  return Math.random().toString(36).slice(-10);
}

export function GeneratedPasswordField({
  name,
  label,
  required = false
}: GeneratedPasswordFieldProps) {
  const [value, setValue] = useState("");

  return (
    <label className="field">
      <span>{label}</span>
      <div className="turicum-inline-input">
        <input
          name={name}
          type="text"
          required={required}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button
          type="button"
          className="turicum-inline-input-button"
          onClick={() => setValue(generatePassword())}
        >
          Generate
        </button>
      </div>
    </label>
  );
}
