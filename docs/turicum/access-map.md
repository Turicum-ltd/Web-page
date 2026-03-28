# Turicum Access And System Map

## Purpose

This note explains who needs access to which system, what each system owns, and how to keep Turicum operable from any trusted computer.

The goal is simple:

- no single-machine dependency
- no single-person dependency
- no hidden production-only knowledge

## System ownership

### GitHub

Owns:

- application code
- migrations
- deployment config
- operational documentation

Primary repo:

- `Turicum-ltd/Web-page`

GitHub should be the source of truth for anything that can be versioned safely.

### DigitalOcean App Platform

Owns:

- production runtime
- production env vars
- deployment activity
- runtime logs

DigitalOcean should not be treated as the source of truth for application logic. It is the runtime host.

### Supabase

Owns:

- auth users
- user profiles
- case access grants
- borrower invite ledger
- shared state that must survive machine changes

Canonical Turicum project:

- `https://anbqpqkwwdrlomffodig.supabase.co`

All Turicum Supabase env values must point to this same project.

### Google Drive

Owns:

- case folders
- source documents
- working drafts
- signed copies and archived deal files

Turicum should store controlled Drive references, not arbitrary external URLs.

### Google Workspace

Owns:

- `@turicum.us` mailboxes
- operator and business email identities

Use it for named inboxes, not for app authorization.

## Human roles

### Core operator

Needs:

- GitHub admin or maintainer access
- DigitalOcean production access
- Supabase admin access
- Google Workspace admin access

Typical responsibilities:

- production deploys
- secret rotation
- incident response
- environment correction

Keep this group small.

### Product or engineering contributor

Needs:

- GitHub access
- staging access when available

Usually should not need:

- production DigitalOcean env access
- Supabase admin access
- domain or email admin access

### Operations admin

Needs:

- Turicum `staff_admin`
- ability to manage users in `/access`

Usually does not need:

- GitHub admin
- DigitalOcean admin
- Supabase admin

### Staff user

Needs:

- named Supabase account
- `turicum_user_profiles` role:
  - `staff_admin`
  - `staff_ops`
  - `staff_counsel`

### Investor user

Needs:

- named Supabase account
- `turicum_user_profiles` role: `investor`
- one or more rows in `turicum_case_access_grants`

### Borrower

Needs:

- scoped invite link or future claimed borrower account

Borrowers should not be granted broad internal-system access.

## Current production access model

### Staff

- sign in through Turicum
- authenticated with Supabase
- role checked through `turicum_user_profiles`

### Investors

- sign in through Turicum
- authenticated with Supabase
- case visibility restricted by `turicum_case_access_grants`

### Borrowers

- use scoped invite access
- linked to case and email
- invite ledger maintained in Supabase

## What should not depend on one computer

The following should never exist only on one machine:

- production env values
- production credentials
- current deployment knowledge
- access-grant knowledge
- recovery steps

If one person changes computers, the system should still be operable.

## Shared operating model

### For code changes

Use:

- GitHub repo
- reviewed commits
- `main` deploy flow

Do not use:

- direct runtime edits
- local-only code as production truth

### For user onboarding

Use:

- `/access` for normal staff and investor setup

Avoid:

- ad hoc Supabase SQL for routine operator work

### For production debugging

Use:

- DigitalOcean deploy activity
- DigitalOcean runtime logs
- `https://turicum.us/api/health`

### For document access

Use:

- controlled Google Drive references
- Turicum document route

Avoid:

- arbitrary external document URLs
- direct public document linking

## Environment boundaries

### Public values

These are safe to expose to the client:

- `NEXT_PUBLIC_APP_ORIGIN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### Server-only values

These must stay server-side:

- `SUPABASE_SERVICE_ROLE_KEY`
- session secrets

### Temporary legacy values

These should be removed after cutover:

- shared team-password env vars
- seeded investor fallback env vars

## Recommended permission split

### GitHub

- most contributors: write access only
- core operators: branch protection and settings access

### DigitalOcean

- only core operators can:
  - edit env vars
  - force rebuilds
  - change domains or production routing

### Supabase

- only trusted operators need full admin
- most day-to-day access changes should move into Turicum `/access`

### Google Workspace and DNS

- at least two trusted admins should have access
- avoid a single admin lock-in

## Recovery principle

Turicum is considered machine-independent when a new trusted operator can:

1. clone the repo
2. read the runbook
3. access GitHub, DigitalOcean, and Supabase with named credentials
4. deploy from `main`
5. verify `/api/health`
6. manage staff and investor access in `/access`

If any of those steps still depend on your local machine, there is still hidden operational debt to remove.
