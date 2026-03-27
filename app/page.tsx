import type { Metadata } from "next";
import { TuricumPortalOverview } from "@/components/turicum/turicum-portal-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Turicum Asset-Based Lending | Purchase, Bridge, Refinance",
  description: "Asset-based lending for property owners, borrowers, and capital partners."
};

export default function HomePage() {
  return <TuricumPortalOverview />;
}
