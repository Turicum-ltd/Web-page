# Turicum Auth & Access Migration Plan

## Why This Exists

Turicum is currently using three different access models:

- team members authenticate via environment-variable email/password pairs
- investors authenticate via a seeded runtime credential and flat-file session store
- borrowers authenticate via case-scoped token links

That works for a prototype, but it does not scale operationally.

Problems in the current setup:

- shared team passwords
- no per-user revocation for staff
- no invite/reset lifecycle for investors
- flat-file investor session storage
- three separate identity models to reason about
- weak auditability around who accessed what

## Target Model

Use **Supabase Auth** as the single identity provider, then layer Turicum authorization on top.

### Identity types

- `staff_admin`
- `staff_ops`
- `staff_counsel`
- `investor`
- `borrower`

### Core principle

Authentication answers **who are you**.
Authorization answers **which Turicum surface or case can you access**.

## New Foundation Added

This repo now includes a first migration for the auth/access foundation:

- `/supabase/migrations/20260327_auth_access_foundation.sql`

It creates:

- `turicum_user_profiles`
  - app-level role metadata tied to `auth.users`
- `turicum_case_access_grants`
  - per-case access rights for staff, investors, and borrowers
- `turicum_borrower_portal_invites`
  - expiring borrower invite/link records for a cleaner borrower path
- helper functions:
  - `current_turicum_role()`
  - `current_turicum_case_access(uuid)`

## Recommended Rollout

### Phase 1: Staff accounts

Replace env-password team login first.

Why start here:

- staff access is the highest-risk shared secret
- the internal surface is the most sensitive
- staff invites and revocation matter immediately

Plan:

1. enable Supabase Auth email sign-in for staff
2. create one `auth.users` record per team member
3. create matching `turicum_user_profiles` rows with:
   - `staff_admin`
   - `staff_ops`
   - `staff_counsel`
4. change middleware and login routes to use Supabase session checks instead of `TURICUM_TEAM_*`
5. leave the old env-password path behind a temporary fallback flag during migration
6. remove `TURICUM_TEAM_EMAIL*` and `TURICUM_TEAM_PASSWORD*` once staff accounts are proven in production

### Phase 2: Investor accounts

Replace seeded investor login with invited investor accounts.

Recommended UX:

- email invite
- magic-link sign-in or passwordless email flow
- optional password fallback later only if demanded operationally

Plan:

1. move investor identity to Supabase Auth
2. create `turicum_user_profiles.role = 'investor'`
3. use `turicum_case_access_grants` to scope investors only to promoted matters they should see
4. replace flat-file investor sessions and seeded credential bootstrap

### Phase 3: Borrower access

Borrowers should keep a low-friction flow, but it should be formalized.

Recommended UX:

- expiring invite links
- claim flow or verified access tied to case/contact
- optional account creation only if the borrower returns repeatedly

Plan:

1. keep borrower links as the front-door UX
2. store invite state in `turicum_borrower_portal_invites`
3. let a borrower claim a link into a borrower account if needed
4. grant case-scoped borrower permissions through `turicum_case_access_grants`

## What This Replaces

### Current team auth

Current files:

- `/lib/turicum/team-auth.ts`
- `/app/api/team-auth/login/route.ts`
- `/app/api/team-auth/logout/route.ts`

Current risks:

- shared passwords
- env drift across deployments
- no individual deactivation

### Current investor auth

Current files:

- `/lib/turicum/investor-auth.ts`
- `/app/api/investor-auth/login/route.ts`
- `/app/api/investor-auth/logout/route.ts`

Current risks:

- seeded credential model
- local JSON-backed session state
- no professional invite lifecycle

## Operational Guardrails

- do not migrate all three audiences at once
- migrate staff first, because it reduces the most risk fastest
- keep one short-lived fallback path during each migration
- remove shared env passwords after each audience is proven live
- use per-case grants instead of broad role-only checks for investor and borrower data

## Immediate Next Implementation Tasks

1. add Supabase session helpers for Turicum auth
2. create a staff invite/bootstrap script
3. replace team middleware checks with Supabase session + `turicum_user_profiles`
4. gate `/review`, `/cases`, `/flows`, `/library`, and other staff routes by role
5. add audit logging for staff sign-in and invite acceptance

## Definition Of Done For Staff Migration

Staff auth is ready when:

- every employee has an individual account
- shared team passwords are gone
- role checks come from Supabase-backed profile rows
- the protected internal routes are no longer unlocked by env password pairs
- a single employee can be revoked without rotating every other employee secret
