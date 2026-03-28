export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { TuricumNav } from "@/components/turicum/nav";
import {
  createOrUpdateInvestorUser,
  createOrUpdateStaffUser,
  getAccessAdminSnapshot,
  grantInvestorCaseAccess,
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

export default async function AccessAdminPage({ searchParams }: { searchParams?: SearchParams }) {
  const cookieStore = await cookies();
  const staffSession = await resolveSupabaseStaffSessionFromCookies(cookieStore);

  if (!staffSession || staffSession.role !== "staff_admin") {
    redirect(withBasePath("/review"));
  }

  const params = (await searchParams) ?? {};
  const status = readString(params.status);
  let accessAdminError: string | null = null;
  let snapshot = null as Awaited<ReturnType<typeof getAccessAdminSnapshot>> | null;

  try {
    snapshot = await getAccessAdminSnapshot();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown access admin error.";
    accessAdminError = message;
  }

  async function saveStaffUser(formData: FormData) {
    "use server";

    await createOrUpdateStaffUser({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      role: String(formData.get("role") ?? "staff_ops") as StaffRole,
      organization: String(formData.get("organization") ?? "Turicum")
    });

    revalidatePath(withBasePath("/access"));
    redirect(withBasePath("/access?status=staff-saved"));
  }

  async function saveInvestorUser(formData: FormData) {
    "use server";

    await createOrUpdateInvestorUser({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      organization: String(formData.get("organization") ?? "Turicum Investor")
    });

    revalidatePath(withBasePath("/access"));
    redirect(withBasePath("/access?status=investor-saved"));
  }

  async function saveInvestorGrant(formData: FormData) {
    "use server";

    await grantInvestorCaseAccess({
      email: String(formData.get("email") ?? ""),
      caseId: String(formData.get("caseId") ?? "")
    });

    revalidatePath(withBasePath("/access"));
    redirect(withBasePath("/access?status=grant-saved"));
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <p className="eyebrow">Access Admin</p>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Manage staff, investor, and borrower access from one internal surface.</h1>
              <p>
                This is the operational layer we were missing. Instead of building users in Supabase
                and then patching role rows manually, the admin surface creates the account, assigns
                the Turicum role, and lets us wire investor case visibility without SQL.
              </p>
            </div>
            <div className="hero-aside">
              <TuricumNav />
              <div className="dashboard-band">
                <div className="band-card">
                  <p className="eyebrow">Staff</p>
                  <strong>{snapshot?.staffUsers.length ?? "—"}</strong>
                  <p className="helper">named internal accounts</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Investors</p>
                  <strong>{snapshot?.investorUsers.length ?? "—"}</strong>
                  <p className="helper">portal identities</p>
                </div>
                <div className="band-card">
                  <p className="eyebrow">Borrower invites</p>
                  <strong>{snapshot?.borrowerInvites.length ?? "—"}</strong>
                  <p className="helper">tracked external links</p>
                </div>
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
          <section className="panel subtle">
            <strong>
              {status === "staff-saved"
                ? "Staff account saved."
                : status === "investor-saved"
                  ? "Investor account saved."
                  : status === "grant-saved"
                    ? "Investor case grant saved."
                    : "Access update saved."}
            </strong>
            <p className="helper">The access tables and account metadata have been refreshed.</p>
          </section>
        ) : null}

        {!snapshot ? null : (
          <>
        <section className="two-up">
          <div className="panel lead">
            <div className="section-head">
              <div>
                <p className="eyebrow">Staff accounts</p>
                <h2>Create or update an internal team user</h2>
              </div>
            </div>
            <form action={saveStaffUser} className="form-grid">
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" required />
              </label>
              <label className="field">
                <span>Full name</span>
                <input name="fullName" type="text" required />
              </label>
              <label className="field">
                <span>Temporary password</span>
                <input name="password" type="text" required />
              </label>
              <label className="field">
                <span>Role</span>
                <select name="role" defaultValue="staff_ops">
                  {staffRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Organization</span>
                <input name="organization" type="text" defaultValue="Turicum" />
              </label>
              <div className="form-actions">
                <button type="submit">Save staff account</button>
              </div>
            </form>
          </div>

          <div className="panel lead">
            <div className="section-head">
              <div>
                <p className="eyebrow">Investor accounts</p>
                <h2>Create or update an investor login</h2>
              </div>
            </div>
            <form action={saveInvestorUser} className="form-grid">
              <label className="field">
                <span>Email</span>
                <input name="email" type="email" required />
              </label>
              <label className="field">
                <span>Full name</span>
                <input name="fullName" type="text" required />
              </label>
              <label className="field">
                <span>Temporary password</span>
                <input name="password" type="text" required />
              </label>
              <label className="field">
                <span>Organization</span>
                <input name="organization" type="text" defaultValue="Turicum Investor" />
              </label>
              <div className="form-actions">
                <button type="submit">Save investor account</button>
              </div>
            </form>
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Investor grants</p>
                <h2>Give an investor access to a specific case</h2>
              </div>
            </div>
            <form action={saveInvestorGrant} className="form-grid">
              <label className="field">
                <span>Investor email</span>
                <input name="email" type="email" required />
              </label>
              <label className="field">
                <span>Case</span>
                <select name="caseId" required defaultValue="">
                  <option value="" disabled>
                    Select a case
                  </option>
                  {snapshot.cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-actions">
                <button type="submit">Grant investor access</button>
              </div>
            </form>
            <p className="helper">
              Investor accounts only see cases that have explicit `turicum_case_access_grants`
              rows.
            </p>
          </div>

          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Borrower links</p>
                <h2>Borrower invite ledger</h2>
              </div>
            </div>
            <ul className="list compact-list">
              {snapshot.borrowerInvites.slice(0, 8).map((invite) => (
                <li key={invite.id}>
                  <strong>{invite.caseCode}</strong> · {invite.email}
                  <br />
                  <span className="helper">
                    {invite.caseTitle} · expires {new Date(invite.expiresAt).toLocaleString("en-US")}
                    {invite.revokedAt ? " · revoked" : ""}
                    {invite.claimedAt ? " · claimed" : ""}
                  </span>
                </li>
              ))}
              {snapshot.borrowerInvites.length === 0 ? (
                <li>No borrower invites have been synced yet.</li>
              ) : null}
            </ul>
          </div>
        </section>

        <section className="two-up">
          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Current staff</p>
                <h2>Named internal access</h2>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Name</th>
                    <th>Last sign-in</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.staffUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.fullName ?? "not set"}</td>
                      <td>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("en-US") : "never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Current investors</p>
                <h2>Investor identities and grants</h2>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Last sign-in</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.investorUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>{user.email}</td>
                      <td>{user.organization ?? "not set"}</td>
                      <td>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("en-US") : "never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section-head" style={{ marginTop: 24 }}>
              <div>
                <p className="eyebrow">Case access</p>
                <h2>Current investor visibility grants</h2>
              </div>
            </div>
            <ul className="list compact-list">
              {snapshot.investorGrants.map((grant) => (
                <li key={grant.id}>
                  <strong>{grant.userEmail}</strong> {"->"} {grant.caseCode}
                  <br />
                  <span className="helper">
                    {grant.caseTitle}
                    {grant.expiresAt ? ` · expires ${new Date(grant.expiresAt).toLocaleString("en-US")}` : " · no expiry"}
                  </span>
                </li>
              ))}
              {snapshot.investorGrants.length === 0 ? (
                <li>No investor case grants yet.</li>
              ) : null}
            </ul>
          </div>
        </section>
          </>
        )}
      </div>
    </main>
  );
}
