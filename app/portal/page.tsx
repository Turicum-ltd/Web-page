import type { Metadata } from "next";
import { TuricumBorrowerOverview } from "@/components/turicum/turicum-borrower-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Turicum | Asset-Based Borrower Path",
  description: "Asset-based borrower entry path for first-call intake and secure packet review."
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFlag(value: string | string[] | undefined) {
  return value === "1" || (Array.isArray(value) && value.includes("1"));
}

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readPreIntakeState(
  value: string | string[] | undefined,
  introRequested: boolean
): "locked" | "prompt" | "scheduled" | "skip" {
  const normalized = readString(value);

  if (normalized === "prompt" || normalized === "scheduled" || normalized === "skip") {
    return normalized;
  }

  if (introRequested) {
    return "scheduled";
  }

  return "locked";
}

export default async function PortalPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};
  const applicationSubmitted = readFlag(params.application);
  const introRequested = readFlag(params.requested);

  return (
    <TuricumBorrowerOverview
      applicationSubmitted={applicationSubmitted}
      applicationSubmittedEmail={readString(params.applicationEmail)}
      introRequested={introRequested}
      introRequestedEmail={readString(params.requestedEmail)}
      preIntakeState={readPreIntakeState(params.preintake, introRequested)}
      error={readString(params.error)}
    />
  );
}
