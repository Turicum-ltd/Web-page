import { redirect } from "next/navigation";
import { withBorrowerPortalPath } from "@/lib/turicum/borrower-portal";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PortalPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = (await searchParams) ?? {};
  const nextSearch = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    const normalized = readString(value);
    if (normalized) {
      nextSearch.set(key, normalized);
    }
  }

  redirect(withBorrowerPortalPath(nextSearch.size ? `/?${nextSearch.toString()}` : "/"));
}
