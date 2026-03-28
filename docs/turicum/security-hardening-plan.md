# Turicum Security Hardening Plan

## Executive Summary

Turicum is now at the stage where product security and operator security need to be tightened together. The main risks are shared-password legacy auth, production secret drift, broad collaborator access, and hidden production failures caused by weak environment validation. This plan turns those into a staged hardening program with clear ownership and rollout order.

## Immediate Priorities

1. Fix production Supabase credential drift.
2. Complete the staff and investor Supabase Auth cutover.
3. Remove legacy shared-password fallbacks.
4. Rotate production secrets after cutover.
5. Protect production delivery and admin surfaces.

## Current Risks

### 1. Shared-password fallback still exists

- Staff login still has a legacy env-password fallback path.
- This weakens revocation, auditability, and least privilege.
- It also creates ambiguity about which auth path production is using.

### 2. Production secret drift is too easy

- Turicum has already hit production failures caused by invalid Supabase credentials.
- The app currently depends on multiple Supabase env variables that must all point to the same project.
- Invalid production secrets currently fail late, often only after an internal page loads.

### 3. Production data access is broader than it should be

- Supabase public-schema tables need intentional RLS coverage.
- Any exposed public table should either:
  - have RLS enabled with explicit policies, or
  - be moved out of the public API surface.

### 4. Collaboration is growing faster than access controls

- More people want to work on Turicum now.
- Without branch protection, staging, and tighter operational roles, contributors can create production risk too easily.

## Hardening Workstreams

### A. Authentication and Authorization

#### Goal

Replace shared credentials with named users, scoped access, and revocation controls.

#### Actions

1. Keep staff on Supabase Auth only.
2. Keep investors on Supabase Auth plus per-case grants.
3. Keep borrowers on scoped invite links with expiry and revocation.
4. Remove legacy `TURICUM_TEAM_*` and investor seeded-password fallbacks after live validation.
5. Add deactivate and revoke controls in `/access`.

#### Success Criteria

- Every staff user has a named account.
- Every investor has a named account or explicit invited identity.
- No shared production passwords are required for normal access.
- Revocation can be performed without SQL.

### B. Secrets and Environment Hygiene

#### Goal

Make production secrets consistent, minimally scoped, and easy to validate.

#### Actions

1. Standardize production Supabase envs so they all point to the same project.
2. Add runtime health checks for:
   - Supabase URL presence
   - service-role key validity
   - critical file readiness
3. Rotate:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TURICUM_TEAM_SESSION_SECRET`
   - any remaining shared team or investor passwords
4. Keep public keys and server keys clearly separated:
   - `NEXT_PUBLIC_*` values are public
   - service-role secrets stay server-only

#### Success Criteria

- `/api/health` shows whether Supabase admin access is valid.
- Production deploys fail early and clearly when credentials are bad.
- No stale or duplicate production secrets remain.

### C. Supabase Data Security

#### Goal

Ensure all exposed tables have explicit access rules.

#### Actions

1. Enable RLS on public-schema tables exposed to PostgREST.
2. Add explicit policies instead of relying on implicit exposure.
3. Review each public table for:
   - read access
   - write access
   - anon vs authenticated use
4. Keep service-role usage server-side only.

#### Example Priority Item

- `public.state_packs`
  - enable RLS
  - add explicit read policy if it is intended to be readable

#### Success Criteria

- No production lint warnings remain for public exposed tables without RLS.
- Public tables have intentional, documented policies.

### D. GitHub and Delivery Controls

#### Goal

Reduce the chance of unsafe production changes as more contributors join.

#### Actions

1. Protect `main`.
2. Require pull requests and at least one review.
3. Add `CODEOWNERS` for:
   - auth
   - deploy
   - env/config
   - middleware
4. Limit direct production branch push access to core operators.
5. Keep auto-deploy on for production only when branch protection is in place.

#### Success Criteria

- Most contributors cannot push directly to `main`.
- Sensitive files require review.
- Production deploys are traceable to reviewed changes.

### E. Environment Separation

#### Goal

Stop debugging production in production.

#### Actions

1. Create a staging Turicum app in DigitalOcean.
2. Use staging for:
   - auth changes
   - deploy changes
   - access control changes
3. Use separate staging secrets and staging Supabase configuration.

#### Success Criteria

- Internal auth and workflow changes are tested before production.
- Production outages from auth/config changes drop materially.

## Immediate Implementation Order

1. Fix production Supabase credential validity.
2. Validate `/review`, `/access`, and staff login against Supabase.
3. Remove shared-password fallback paths.
4. Rotate production secrets.
5. Enable or correct RLS on exposed public tables.
6. Protect GitHub `main`.
7. Add staging.

## Operator Checklist

### Supabase

- [ ] Confirm Turicum uses one canonical Supabase project.
- [ ] Replace invalid production service-role key.
- [ ] Rotate service-role key after cutover.
- [ ] Enable RLS on exposed public tables.
- [ ] Review policies for `state_packs`, `cases`, and related public tables.

### DigitalOcean

- [ ] Verify production env vars all point to the same Supabase project.
- [ ] Keep only necessary operators able to edit env vars and deploy production.
- [ ] Add alerting for deploy failures and runtime failures.
- [ ] Create staging app.

### GitHub

- [ ] Protect `main`.
- [ ] Require PR review.
- [ ] Add `CODEOWNERS`.
- [ ] Restrict direct push rights.

### App

- [ ] Remove legacy team-password fallback.
- [ ] Remove legacy investor seeded-password fallback.
- [ ] Add revoke/deactivate controls in `/access`.
- [ ] Keep `/review` and `/access` on graceful failure paths until the internal data dependencies are fully stabilized.

## Notes

- `NEXT_PUBLIC_*` values are not secrets and must be treated as public.
- Service-role credentials must never be exposed to the client bundle.
- Production should prefer clear health failures over silent or digest-only crashes.
