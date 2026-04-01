import type { Metadata } from "next";
import { TuricumBorrowerOverview } from "@/components/turicum/turicum-borrower-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Turicum quick asset intake",
  description: "Quick asset intake for borrowers who need fast asset-based lending feedback."
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFlag(value: string | string[] | undefined) {
  return value === "1" || (Array.isArray(value) && value.includes("1"));
}

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PortalPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};

  return (
    <TuricumBorrowerOverview
      introRequested={readFlag(params.requested)}
      introRequestedEmail={readString(params.requestedEmail)}
      error={readString(params.error)}
      preIntakeState="locked"
    />
  );
}
