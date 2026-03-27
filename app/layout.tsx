import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap"
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-editorial",
  display: "swap"
});

function normalizeBasePath(input: string | undefined) {
  if (!input) {
    return "/turicum";
  }
  const trimmed = input.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }
  return (trimmed.startsWith("/") ? trimmed : `/${trimmed}`).replace(/\/+$/, "");
}

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.TURICUM_BASE_PATH ?? "/turicum");
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
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
