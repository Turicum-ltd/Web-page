import { notFound } from "next/navigation";
import Link from "next/link";
import { AtlasNav } from "@/components/atlas/nav";
import { getCaseById } from "@/lib/atlas/cases";
import { getCaseInvestorPromotion } from "@/lib/atlas/investor-promotion";
import { getCaseServicingRecord } from "@/lib/atlas/lifecycle";
import { withBasePath } from "@/lib/atlas/runtime";
export const dynamic = "force-dynamic";
export default async function InvestorsWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseItem = await getCaseById(id);
  if (!caseItem) notFound();
  const promotion = await getCaseInvestorPromotion(id);
  const servicing = await getCaseServicingRecord(id);
  return <main><div className="shell"><section className="hero"><p className="eyebrow">Investor Workspace</p><div className="hero-grid"><div className="hero-copy"><h1>{caseItem.title}</h1><p>This is the investor-facing operating lane: promotion outcome, final investor structure, monthly updates, and the eventual payoff or rollover story.</p></div><div className="hero-aside"><AtlasNav /><div className="dashboard-band"><div className="band-card"><p className="eyebrow">Promotion</p><strong>{(promotion?.status ?? "pending").replaceAll("_", " ")}</strong><p className="helper">capital markets state</p></div><div className="band-card"><p className="eyebrow">Final structure</p><strong>{(promotion?.finalStructure ?? "undecided").replaceAll("_", " ")}</strong><p className="helper">investor stack</p></div><div className="band-card"><p className="eyebrow">Servicing</p><strong>{(servicing?.status ?? "setup").replaceAll("_", " ")}</strong><p className="helper">post-close cadence</p></div></div></div></div></section><section className="two-up"><div className="panel lead"><p className="eyebrow">Investor story</p><h2>Promotion to performance</h2><p>{promotion?.investorSummary || "No investor summary yet."}</p><ul className="list"><li><strong>Target investors:</strong> {promotion?.targetInvestorCount ?? "not set"}</li><li><strong>Final investors:</strong> {promotion?.finalInvestorCount ?? "not set"}</li><li><strong>Lead investor:</strong> {promotion?.leadInvestorName || "not set"}</li></ul><div className="form-actions"><Link className="secondary-button" href={withBasePath(`/cases/${id}/investor-promotion`)}>Open investor promotion</Link><Link className="secondary-button" href={withBasePath(`/cases/${id}/servicing`)}>Open servicing lane</Link><Link className="secondary-button" href={withBasePath(`/cases/${id}/exit`)}>Open exit lane</Link></div></div><div className="panel"><p className="eyebrow">Monthly updates</p><h2>What investors should keep seeing</h2><ul className="list">{(servicing?.updates ?? []).map((update) => <li key={update.id}><strong>{update.periodLabel}:</strong> {update.paymentStatus} · {update.amountSummary}</li>)}</ul><p className="helper">Turicum LLC should make monthly payment, reserve, and narrative updates easy to review without reopening the legal workspace.</p></div></section></div></main>;
}
