import type { Metadata } from "next";
import { TuricumReviewOverview } from "@/components/atlas/turicum-review-overview";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Turicum LLC | Team Hub",
  description: "Protected staff hub for Turicum operations, workflow gates, live blockers, and deployment readiness."
};

export default function ReviewPage() {
  return <TuricumReviewOverview />;
}
