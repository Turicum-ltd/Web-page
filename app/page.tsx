import type { Metadata } from "next";
import { TuricumPortalOverview } from "@/components/turicum/turicum-portal-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Turicum Private Credit | Investor Access",
  description: "Boutique private credit for disciplined investors seeking first-lien, asset-based opportunities and attractive passive returns."
};

export default function HomePage() {
  return <TuricumPortalOverview />;
}
