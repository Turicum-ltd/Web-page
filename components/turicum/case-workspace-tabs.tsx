import Link from "next/link";
import { withBasePath } from "@/lib/turicum/runtime";

type CaseWorkspaceTab = "overview" | "diligence";

const CASE_WORKSPACE_TABS: Array<{
  id: CaseWorkspaceTab;
  label: string;
  href: (caseId: string) => string;
}> = [
  {
    id: "overview",
    label: "Overview",
    href: (caseId) => withBasePath(`/cases/${caseId}`)
  },
  {
    id: "diligence",
    label: "Diligence Review",
    href: (caseId) => withBasePath(`/cases/${caseId}/diligence-review`)
  }
];

export function CaseWorkspaceTabs({
  caseId,
  activeTab
}: {
  caseId: string;
  activeTab: CaseWorkspaceTab;
}) {
  return (
    <nav className="turicum-case-workspace-tabs" aria-label="Case workspace tabs">
      {CASE_WORKSPACE_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href(caseId)}
          className={`secondary-button${tab.id === activeTab ? " is-active" : ""}`}
          aria-current={tab.id === activeTab ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
