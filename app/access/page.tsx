export const dynamic = "force-dynamic";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { deleteUser } from "@/app/actions/admin";
import { getAuditLogs } from "@/app/access/actions";
import { AccessDashboardShell } from "@/components/turicum/access-dashboard-shell";
import { TuricumNav } from "@/components/turicum/nav";
import {
  createOrUpdateBorrowerInvite,
  createOrUpdateInvestorUser,
  createOrUpdateStaffUser,
  getAccessAdminSnapshot,
  grantInvestorCaseAccessBulk,
  refreshBorrowerInvite,
  revokeBorrowerInvite,
  revokeInvestorCaseAccess,
  setUserProfileActiveState,
  type StaffRole
} from "@/lib/turicum/access-admin";
import { resolveSupabaseStaffSessionFromCookies } from "@/lib/turicum/staff-supabase-auth";
import { withBasePath } from "@/lib/turicum/runtime";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const staffRoleOptions: Array<{ value: StaffRole; label: string }> = [
  { value: "staff_admin", label: "Staff admin" },
  { value: "staff_ops", label: "Staff ops" },
  { value: "staff_counsel", label: "Staff counsel" }
];

function rethrowRedirectError(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

export default async function AccessAdminPage({ searchParams }: { searchParams?: SearchParams }) {
  const cookieStore = await cookies();
  const staffSession = await resolveSupabaseStaffSessionFromCookies(cookieStore);

  if (!staffSession || staffSession.role !== "staff_admin") {
    redirect(withBasePath("/review"));
  }

  const adminUserId = staffSession.userId;
  const adminActorEmail = staffSession.email;

  const params = (await searchParams) ?? {};
  const status = readString(params.status);
  const borrowerToken = readString(params.borrowerToken);
  const message = readString(params.message);
  const currentCaseId = readString(params.caseId);
  let accessAdminError: string | null = null;
  let snapshot = null as Awaited<ReturnType<typeof getAccessAdminSnapshot>> | null;

  try {
    snapshot = await getAccessAdminSnapshot();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown access admin error.";
    accessAdminError = message;
  }

  const currentCase = currentCaseId
    ? snapshot?.cases.find((item) => item.id === currentCaseId) ?? null
    : null;
  const caseWorkspaceHref = currentCase
    ? withBasePath(`/cases/${currentCase.id}`)
    : withBasePath("/cases");
  const activeCases =
    snapshot?.cases.filter(
      (item) => item.stage !== "closed" && item.stage !== "declined" && item.status !== "archive"
    ) ?? [];

  function buildAccessPath(nextStatus?: string, nextMessage?: string, extra?: Record<string, string>) {
    const search = new URLSearchParams();

    if (currentCaseId) {
      search.set("caseId", currentCaseId);
    }

    if (nextStatus) {
      search.set("status", nextStatus);
    }

    if (nextMessage) {
      search.set("message", nextMessage);
    }

    for (const [key, value] of Object.entries(extra ?? {})) {
      if (value) {
        search.set(key, value);
      }
    }

    const query = search.toString();
    return withBasePath(`/access${query ? `?${query}` : ""}`);
  }

  async function saveStaffUser(formData: FormData) {
    "use server";
    try {
      await createOrUpdateStaffUser({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        fullName: String(formData.get("fullName") ?? ""),
        role: String(formData.get("role") ?? "staff_ops") as StaffRole,
        organization: String(formData.get("organization") ?? "Turicum")
      });

      revalidatePath(withBasePath("/access"));
      redirect(buildAccessPath("staff-saved"));
    } catch (error) {
      rethrowRedirectError(error);
      const errorMessage = error instanceof Error ? error.message : "Staff account could not be saved.";
      redirect(buildAccessPath("error", errorMessage));
    }
  }

  async function saveInvestorUser(formData: FormData) {
    "use server";
    try {
      await createOrUpdateInvestorUser({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        fullName: String(formData.get("fullName") ?? ""),
        organization: String(formData.get("organization") ?? "Turicum Investor")
      });

      revalidatePath(withBasePath("/access"));
      redirect(buildAccessPath("investor-saved"));
    } catch (error) {
      rethrowRedirectError(error);
      const errorMessage = error instanceof Error ? error.message : "Investor account could not be saved.";
      redirect(buildAccessPath("error", errorMessage));
    }
  }

  async function saveInvestorGrant(formData: FormData) {
    "use server";
    try {
      if (!adminActorEmail) {
        throw new Error("Active admin email is unavailable for audit logging.");
      }

      const saved = await grantInvestorCaseAccessBulk({
        actorEmail: adminActorEmail,
        email: String(formData.get("email") ?? ""),
        caseIds: formData.getAll("caseIds").map((value) => String(value))
      });

      revalidatePath(withBasePath("/access"));
      return {
        ok: true,
        count: saved.count,
        email: saved.email
      };
    } catch (error) {
      rethrowRedirectError(error);
      return {
        ok: false,
        message:
          error instanceof Error ? error.message : "Investor case grant could not be saved."
      };
    }
  }

  async function saveBorrowerInvite(formData: FormData) {
    "use server";
    try {
      const portal = await createOrUpdateBorrowerInvite({
        caseId: String(formData.get("caseId") ?? ""),
        borrowerName: String(formData.get("borrowerName") ?? ""),
        borrowerEmail: String(formData.get("borrowerEmail") ?? ""),
        portalTitle: String(formData.get("portalTitle") ?? "")
      });

      revalidatePath(withBasePath("/access"));
      redirect(buildAccessPath("borrower-saved", undefined, { borrowerToken: portal.accessToken }));
    } catch (error) {
      rethrowRedirectError(error);
      const errorMessage = error instanceof Error ? error.message : "Borrower invite could not be created.";
      redirect(buildAccessPath("error", errorMessage));
    }
  }

  async function toggleUserStatus(formData: FormData) {
    "use server";

    const userId = String(formData.get("userId") ?? "");
    const nextIsActive = String(formData.get("nextIsActive") ?? "") === "true";

    if (userId === adminUserId && !nextIsActive) {
      redirect(buildAccessPath("self-blocked"));
    }

    try {
      await setUserProfileActiveState({
        userId,
        isActive: nextIsActive
      });

      revalidatePath(withBasePath("/access"));
      redirect(buildAccessPath(nextIsActive ? "user-activated" : "user-deactivated"));
    } catch (error) {
      rethrowRedirectError(error);
      const errorMessage = error instanceof Error ? error.message : "User status could not be updated.";
      redirect(buildAccessPath("error", errorMessage));
    }
  }

  async function revokeGrant(formData: FormData) {
    "use server";
    try {
      await revokeInvestorCaseAccess(String(formData.get("grantId") ?? ""));
      revalidatePath(withBasePath("/access"));
      redirect(buildAccessPath("grant-revoked"));
    } catch (error) {
      rethrowRedirectError(error);
      const errorMessage = error instanceof Error ? error.message : "Investor access could not be revoked.";
      redirect(buildAccessPath("error", errorMessage));
    }
  }

  async function revokeInvite(formData: FormData) {
    "use server";
    try {
      await revokeBorrowerInvite(String(formData.get("inviteId") ?? ""));
      revalidatePath(withBasePath("/access"));
      redirect(buildAccessPath("invite-revoked"));
    } catch (error) {
      rethrowRedirectError(error);
      const errorMessage = error instanceof Error ? error.message : "Borrower invite could not be revoked.";
      redirect(buildAccessPath("error", errorMessage));
    }
  }

  async function refreshInvite(formData: FormData) {
    "use server";
    try {
      if (!adminActorEmail) {
        throw new Error("Active admin email is unavailable for audit logging.");
      }

      const refreshed = await refreshBorrowerInvite({
        inviteId: String(formData.get("inviteId") ?? ""),
        actorEmail: adminActorEmail
      });
      revalidatePath(withBasePath("/access"));
      return {
        ok: true,
        expiresAt: refreshed.expiresAt
      };
    } catch (error) {
      rethrowRedirectError(error);
      return {
        ok: false,
        message:
          error instanceof Error ? error.message : "Borrower invite link could not be refreshed."
      };
    }
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <nav className="turicum-breadcrumbs" aria-label="Breadcrumb">
            <Link href={withBasePath("/")}>Home</Link>
            <span aria-hidden="true">&gt;</span>
            <Link href={withBasePath("/cases")}>Cases</Link>
            <span aria-hidden="true">&gt;</span>
            <span aria-current="page">Access</span>
          </nav>
          <p className="eyebrow">Access Admin</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="turicum-title-row">
                <h1>Manage staff, investor, and borrower access from one internal surface.</h1>
                <Link className="secondary-button" href={caseWorkspaceHref}>
                  Back to Case
                </Link>
              </div>
              <p>
                This is the operational layer we were missing. Instead of building users in Supabase
                and then patching role rows manually, the admin surface creates the account, assigns
                the Turicum role, and lets us wire investor case visibility without SQL.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="band-card turicum-access-hero-note">
                <p className="eyebrow">Control surface</p>
                <strong>Operators can create users, grant visibility, and manage borrower links from one surface.</strong>
                <p className="helper">
                  The new dashboard header below keeps the live staff, investor, and inquiry totals in view.
                </p>
              </div>
            </div>
          </div>
        </section>

        {accessAdminError ? (
          <section className="panel subtle">
            <strong>Access admin could not load on this deployment yet.</strong>
            <p className="helper">
              {accessAdminError}
            </p>
            <p className="helper">
              Check that `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and the
              publishable key are present on the live deployment, then redeploy.
            </p>
          </section>
        ) : null}

        {status ? (
          <section className={`panel subtle ${status === "error" ? "turicum-form-callout-error" : "turicum-form-callout-success"}`}>
            <strong>
              {status === "error"
                ? "Access update needs attention."
                : status === "staff-saved"
                ? "Staff account saved."
                : status === "investor-saved"
                  ? "Investor account saved."
                  : status === "grant-saved"
                    ? "Investor case grant saved."
                    : status === "user-deactivated"
                      ? "User deactivated."
                        : status === "user-activated"
                        ? "User reactivated."
                        : status === "grant-revoked"
                          ? "Investor case grant revoked."
                          : status === "invite-revoked"
                            ? "Borrower invite revoked."
                            : status === "invite-refreshed"
                              ? "Borrower link refreshed."
                            : status === "borrower-saved"
                              ? "Borrower invite created."
                            : status === "self-blocked"
                              ? "You cannot deactivate your own admin account here."
                    : "Access update saved."}
            </strong>
            <p className="helper">
              {message ? message : "The access tables and account metadata have been refreshed."}
              {status === "borrower-saved" && borrowerToken ? (
                <>
                  {" "}Share the borrower portal here:{" "}
                  <a href={withBasePath(`/borrower/${borrowerToken}`)}>
                    {withBasePath(`/borrower/${borrowerToken}`)}
                  </a>
                </>
              ) : null}
            </p>
          </section>
        ) : null}

        {!snapshot ? null : (
          <AccessDashboardShell
            snapshot={snapshot}
            activeCases={activeCases.map((item) => ({
              id: item.id,
              code: item.code,
              title: item.title,
              stage: item.stage
            }))}
            currentCaseId={currentCase?.id}
            caseWorkspaceHref={caseWorkspaceHref}
            saveStaffUser={saveStaffUser}
            saveInvestorUser={saveInvestorUser}
            saveInvestorGrant={saveInvestorGrant}
            saveBorrowerInvite={saveBorrowerInvite}
            toggleUserStatus={toggleUserStatus}
            deleteUser={deleteUser}
            loadAuditHistory={getAuditLogs}
            refreshInvite={refreshInvite}
            revokeInvite={revokeInvite}
            revokeGrant={revokeGrant}
            staffRoleOptions={staffRoleOptions}
          />
        )}
      </div>
    </main>
  );
}
