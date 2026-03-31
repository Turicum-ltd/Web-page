import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function PortalInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function PortalSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} />;
}

export function PortalTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} />;
}
