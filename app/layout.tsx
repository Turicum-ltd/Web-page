import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

function normalizeBasePath(input: string | undefined) {
  if (!input) {
    return "/atlas";
  }
  const trimmed = input.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }
  return (trimmed.startsWith("/") ? trimmed : `/${trimmed}`).replace(/\/+$/, "");
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.ATLAS_BASE_PATH ?? "/atlas");
const iconHref = `${basePath || ""}/icon.svg`;

export const metadata: Metadata = {
  title: "Turicum LLC",
  description: "State-aware deal, closing, and document pipeline for Turicum LLC.",
  icons: {
    icon: iconHref,
    shortcut: iconHref,
    apple: iconHref
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
