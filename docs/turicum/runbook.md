# Turicum Runbook

## Purpose

This runbook is the operator guide for running `turicum.us` from any trusted computer without depending on one local machine, one browser session, or undocumented memory.

Use it for:

- production deploys
- production verification
- incident response
- access changes
- secret rotation

## Source of truth

Turicum should be treated as a shared system with three main sources of truth:

- GitHub: application code, migrations, deployment config, documentation
- DigitalOcean App Platform: production runtime and production environment variables
- Supabase: authentication, workflow state, access grants, and shared persistence

Google Drive remains the source of truth for document binaries and working deal folders.

No critical workflow should depend on:

- a local JSON file on one machine
- a local-only environment file
- a remembered manual step that is not written down

## Core systems

### GitHub

- Repo: `Turicum-ltd/Web-page`
- Branch: `main`
- Production deploy source

### DigitalOcean

- App Platform app serving `https://turicum.us`
- Auto-deploy from `main`
- Production environment variables live here

### Supabase

- Canonical project URL: `https://anbqpqkwwdrlomffodig.supabase.co`
- Holds auth users, access grants, and shared state

### Google Drive

- Holds case folders and document binaries
- Turicum stores controlled references to Drive resources, not arbitrary external URLs

## Operator prerequisites

A trusted operator should have named access to:

- GitHub repo access
- DigitalOcean App Platform access
- Supabase project access
- Google Workspace or domain-admin access if email or DNS work is needed

Do not rely on:

- shared passwords
- one maintainer's local shell profile
- one person's browser session remaining logged in

## Standard production deploy

### 1. Make and verify the change locally

From the repo root:

```bash
npm install
npm run build
```

If the change affects auth, case access, or data handling, also verify the relevant route or flow locally.

### 2. Commit and push to `main`

Production is set to auto-deploy from GitHub `main`.

Once the change is pushed:

- DigitalOcean should start a deployment automatically
- if it does not, force a rebuild from the DigitalOcean app UI

### 3. Watch deployment activity

In DigitalOcean App Platform:

- open the Turicum app
- confirm the deployment is running for the latest commit
- confirm it reaches healthy status

### 4. Verify production

Run this check after every production deploy:

- `https://turicum.us/api/health`
- `https://turicum.us/`
- `https://turicum.us/team-login`
- sign in as a known staff admin
- `https://turicum.us/review`
- `https://turicum.us/access`

If the change affects investors:

- test `https://turicum.us/investors`
- confirm investor case visibility is still properly scoped

If the change affects borrower intake or documents:

- test borrower entry routes
- test a controlled Google Drive document reference

## Production incident response

### Symptom: internal page crashes

Examples:

- `/review` fails
- `/access` fails
- generic application error page appears

Check in this order:

1. `https://turicum.us/api/health`
2. DigitalOcean deployment status
3. DigitalOcean runtime logs
4. Supabase credential validity in app env

Common causes:

- invalid `SUPABASE_SERVICE_ROLE_KEY`
- mismatched Supabase URL and keys
- deploy canceled or stale
- missing runtime data dependency

### Symptom: sign-in fails

Check:

1. Supabase project is the canonical Turicum project
2. production env vars point to the same Supabase project
3. user exists in `auth.users`
4. user has a matching `turicum_user_profiles` row
5. user role is active and valid

### Symptom: deploy did not go live

Check:

1. commit is on GitHub `main`
2. DigitalOcean saw the new commit
3. auto-deploy did not get canceled
4. app health and route checks are green after deploy

If needed:

- use DigitalOcean `Force rebuild and deploy`

## Rollback

If the newest production change is bad:

1. identify the last known good commit on GitHub
2. revert the bad commit locally or on a branch
3. push the revert to `main`
4. let DigitalOcean auto-deploy the revert
5. verify:
   - `/api/health`
   - `/review`
   - `/access`
   - login

Avoid one-off hotfixes directly in the runtime environment. GitHub should remain the source of truth.

## Environment variable ownership

### Public/runtime metadata

- `APP_ORIGIN`
- `NEXT_PUBLIC_APP_ORIGIN`
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Server-only secrets

- `SUPABASE_SERVICE_ROLE_KEY`
- `TURICUM_TEAM_SESSION_SECRET`

### Temporary legacy values to remove after cutover

- `TURICUM_TEAM_EMAIL`
- `TURICUM_TEAM_PASSWORD`
- `TURICUM_TEAM_EMAIL_2`
- `TURICUM_TEAM_PASSWORD_2`
- investor seeded-password fallback values

## Access management

Preferred operator flow:

1. sign in as `staff_admin`
2. manage staff and investors in `/access`
3. use Supabase SQL only for repair or migration work

Target state:

- normal onboarding and revocation happen in Turicum itself
- production access changes do not require ad hoc SQL

## Secret rotation

Rotate these after major auth or infrastructure changes:

- `SUPABASE_SERVICE_ROLE_KEY`
- `TURICUM_TEAM_SESSION_SECRET`
- any remaining shared team or investor passwords

After rotation:

1. update DigitalOcean env vars
2. redeploy
3. verify `/api/health`
4. verify login and `/review`

## What still needs to move off local-machine dependency

These should continue moving into shared systems:

- local JSON workflow state
- local-only fallback persistence
- manual SQL-only operational steps
- any production secret that currently exists only in a local env file

## Minimum post-deploy checklist

- [ ] New commit is on GitHub `main`
- [ ] DigitalOcean deployed the same commit
- [ ] `/api/health` returns healthy status
- [ ] staff login works
- [ ] `/review` loads
- [ ] `/access` loads
- [ ] changed feature path works
- [ ] no new runtime errors appear in DigitalOcean logs
