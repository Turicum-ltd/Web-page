import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

interface PortalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export function PortalButton({ children, variant = "primary", className = "", ...props }: PortalButtonProps) {
  const baseClass = variant === "primary"
    ? "secondary-button turicum-primary-button"
    : "secondary-button";

  return (
    <button className={`${baseClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function PortalButtonLink({
  href,
  children,
  variant = "primary",
  className = ""
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const baseClass = variant === "primary"
    ? "secondary-button turicum-primary-button"
    : "secondary-button";

  return (
    <Link className={`${baseClass} ${className}`.trim()} href={href}>
      {children}
    </Link>
  );
}
