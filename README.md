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
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Supabase Mode

Turicum LLC runs against local JSON by default. To switch the repository layer to Supabase, set:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=turicum-documents
TURICUM_BASE_PATH=
APP_ORIGIN=https://turicum.us
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_APP_ORIGIN=https://turicum.us
```

Use `TURICUM_BASE_PATH` and `APP_ORIGIN` as the server-side source of truth. Keep the `NEXT_PUBLIC_*` values aligned only because client-side path/origin helpers need a safe public fallback.

`SUPABASE_STORAGE_BUCKET` is optional. If omitted, Turicum LLC uses `turicum-documents`.

The app will automatically use Supabase for case reads and writes when both credential values are present.

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
- `/portal`: borrower public path
- `/investors`: investor portal
- `/investor-handoff`: investor-safe summary surface
- `/review`: protected team hub
- `/team-login`: team sign-in surface
- `/cases`: case board
- `/cases/new`: create case
- `/cases/[id]`: case detail and packet workspace
- `/cases/[id]/intake`: internal borrower-intake and signature workspace
- `/borrower/[token]`: borrower-facing intake portal
- `/library`: precedent library
- `/state-packs`: state-pack overview
- `/state-packs/[state]`: state-pack detail
- `/api/cases`: JSON feed of cases
- `/api/cases/[id]`: JSON feed for one case and its checklist
- `/api/precedents`: JSON feed of precedent records
- `/api/document-types`: JSON feed of document types
- `/api/state-packs`: JSON feed of all state packs

## Borrower Intake and Signature Mode

Turicum LLC now has a first-pass borrower access model:

- create or open a case
- go to `/cases/[id]/intake`
- assign which borrower-facing forms belong in the packet
- copy the generated borrower portal link
- let the borrower complete the intake at `/borrower/[token]`
- queue formal signature requests from the same internal intake workspace

The current signature layer is a routing and tracking system. Turicum LLC stores the request status and provider choice, but it does not yet send or legally execute the signature itself.

## Notes

Turicum LLC currently supports:

- live Supabase-backed cases
- auto-generated checklist items per case
- borrower portal links and borrower-submitted intake responses
- case document links that can point to Google Drive without moving the underlying files
- optional case document uploads to local storage or Supabase Storage depending on configuration
- local JSON persistence for borrower intake packets and signature request staging

## Packaging For Another Machine

Create a deployment bundle with:

```bash
./scripts/package-turicum.sh
```

Mac Studio / OpenClaw deployment notes are in [docs/turicum/macstudio-openclaw-deploy.md](docs/turicum/macstudio-openclaw-deploy.md).

## Simplest Move

1. Copy the whole `turicum-platform` repo folder to the target machine.
2. Double-click [start-turicum.command](start-turicum.command) to run Turicum locally on port `3100`.
3. If you want the legacy MarketShift-mounted version under `/turicum`, double-click [start-turicum-marketshift.command](start-turicum-marketshift.command) instead.
