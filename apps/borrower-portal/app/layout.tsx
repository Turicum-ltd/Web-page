import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap"
});

const displayFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-editorial",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Turicum Borrower Portal",
  description: "Borrower intake and commercial loan application portal for Turicum LLC.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
