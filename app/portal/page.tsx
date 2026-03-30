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

export default async function PortalPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};

  return (
    <TuricumBorrowerOverview
      submitted={readFlag(params.application) || readFlag(params.requested)}
      submittedEmail={readString(params.applicationEmail) ?? readString(params.requestedEmail)}
      error={readString(params.error)}
    />
  );
}
