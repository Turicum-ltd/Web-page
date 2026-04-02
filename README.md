# Turicum LLC Platform

Lean MVP foundation for a state-aware real-estate deal and closing platform.

## Documentation

- Platform guide: [docs/turicum/platform-guide.md](docs/turicum/platform-guide.md)
- Turicum LLC docs index: [docs/turicum/README.md](docs/turicum/README.md)
- DigitalOcean transfer: [docs/turicum/digitalocean-transfer.md](docs/turicum/digitalocean-transfer.md)
- GitHub transfer prep: [docs/turicum/github-transfer-prep.md](docs/turicum/github-transfer-prep.md)

## Current Scope

- deal intake and screening
- configurable state packs
- borrower-facing intake forms
- document packet model
- signature request staging
- closing workflow
- manual payment tracking

Phase 1 target states:

- `FL`
- `IN`
- `OH`
- `TX`

## Stack

- `Next.js`
- `React`
- `TypeScript`
- `Supabase` for database and storage when configured
- config-driven state packs under `config/state-packs/`

## Run Locally

```bash
git clone https://github.com/Turicum-ltd/Web-page.git
cd Web-page
npm install
npm run dev
npm run dev:borrower-portal
```

Then open:

- [http://localhost:3000](http://localhost:3000) for the main Turicum app
- [http://localhost:3001](http://localhost:3001) for the standalone borrower app if the borrower workspace uses the default Next port fallback

Copy `.env.local.example` to `.env.local` and fill the real values before using auth or Supabase-backed flows.

## Supabase Mode

Turicum now expects the shared Turicum Supabase project for investor auth, staff auth, access admin, borrower pre-intake leads, and commercial loan applications.

At minimum, set:

```bash
SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=turicum-documents
TURICUM_BASE_PATH=
APP_ORIGIN=https://turicum.us
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_APP_ORIGIN=https://turicum.us
BORROWER_PORTAL_ORIGIN=https://borrow.turicum.us
NEXT_PUBLIC_BORROWER_PORTAL_ORIGIN=https://borrow.turicum.us
BORROWER_PORTAL_HOST=borrow.turicum.us
```

Use `TURICUM_BASE_PATH` and `APP_ORIGIN` as the main-app server-side source of truth. Keep the `NEXT_PUBLIC_*` values aligned because client-side auth and origin helpers need them.

`SUPABASE_STORAGE_BUCKET` is optional. If omitted, Turicum LLC uses `turicum-documents`.

An env template is available at [deploy/digitalocean/.env.production.example](deploy/digitalocean/.env.production.example).

## Supabase SQL

Run these in your Supabase SQL editor, in order:

1. [supabase/schema.sql](supabase/schema.sql)
2. [supabase/seed.sql](supabase/seed.sql)

Quick setup notes are in [scripts/setup-supabase.md](scripts/setup-supabase.md).

## Key Folders

- `app/`: Next.js routes
- `components/`: shared UI
- `lib/turicum/`: domain types, config loaders, repositories
- `config/state-packs/`: machine-readable state pack definitions
- `docs/turicum/`: product and implementation docs
- `supabase/`: SQL schema and seed files

## Current App Routes

- `/`: Turicum public landing page
- `/portal`: redirect to `https://borrow.turicum.us`
- `/investors`: investor portal
- `/investor-handoff`: investor-safe summary surface
- `/review`: protected team hub
- `/team-login`: team sign-in surface
- `/cases`: case board
- `/cases/new`: create case
- `/cases/[id]`: case detail and packet workspace
- `/cases/[id]/intake`: internal borrower-intake and signature workspace
- `borrow.turicum.us`: standalone borrower quick-intake portal
- `borrow.turicum.us/apply/[token]`: borrower application handoff
- `/library`: precedent library
- `/state-packs`: state-pack overview
- `/state-packs/[state]`: state-pack detail
- `/api/cases`: JSON feed of cases
- `/api/cases/[id]`: JSON feed for one case and its checklist
- `/api/precedents`: JSON feed of precedent records
- `/api/document-types`: JSON feed of document types
- `/api/state-packs`: JSON feed of all state packs

## Surface Ownership

- Main app: investor lane, admin lane, review, cases, flows, library
- Borrower app: quick intake plus secure application handoff

The current source-of-truth split is documented in [docs/turicum-surface-ownership.md](docs/turicum-surface-ownership.md).

## Notes

Turicum LLC currently supports:

- live Supabase-backed cases
- auto-generated checklist items per case
- borrower portal links and borrower-submitted intake responses
- case document links that can point to Google Drive without moving the underlying files
- optional case document uploads to local storage or Supabase Storage depending on configuration
- local JSON persistence for borrower intake packets and signature request staging

## Moving To Another Machine

Recommended path:

1. Clone fresh from GitHub
2. Copy `.env.local`
3. Install Node 22
4. Run:

```bash
npm install
npm run build
npm run build:borrower-portal
```

Use [docs/turicum/digitalocean-transfer.md](docs/turicum/digitalocean-transfer.md) for server deployment. Historical OpenClaw/MarketShift notes live under [docs/turicum/legacy](docs/turicum/legacy) and should not be treated as the default path.
