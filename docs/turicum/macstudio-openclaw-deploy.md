# Turicum Deployment To Mac Studio / OpenClaw

## Goal

Move Turicum as it stands to the Mac Studio and make it available behind your MarketShift infrastructure.

## Recommended Deployment Shape

### Best first step

Deploy Turicum as its own app process first, then mount it into MarketShift after validation.

Recommended order:

1. `turicum.us` or an internal hostname first
2. use the legacy MarketShift-mounted path only if you intentionally still need it

Turicum is now base-path aware, so it can be built with `TURICUM_BASE_PATH=/turicum` when you are ready to mount it under the main site.

## Packaging The App

From the Turicum project root run:

```bash
./scripts/package-turicum.sh
```

This creates a tarball in `dist/` that includes the app source, config, data, docs, and Supabase files.

It excludes:

- `node_modules`
- `.next`
- `.env.local`
- local build cache files

## What To Copy Separately

Copy or recreate these on the Mac Studio:

- `.env.local`
- any local `storage/` folder if you want uploaded local files preserved

Note: borrower portal state currently lives in `data/borrower-portals.json`, so that file matters until that layer is moved fully into Supabase.

## Environment Variables

Turicum currently supports:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=turicum-documents
TURICUM_BASE_PATH=/turicum
APP_ORIGIN=https://marketshift.net
NEXT_PUBLIC_BASE_PATH=/turicum
NEXT_PUBLIC_APP_ORIGIN=https://marketshift.net
```

### If running as a subdomain first

Use:

```bash
TURICUM_BASE_PATH=
APP_ORIGIN=https://turicum.us
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_APP_ORIGIN=https://turicum.us
```

### If running under `marketshift.net/turicum`

Use:

```bash
TURICUM_BASE_PATH=/turicum
APP_ORIGIN=https://marketshift.net
NEXT_PUBLIC_BASE_PATH=/turicum
NEXT_PUBLIC_APP_ORIGIN=https://marketshift.net
```

## Install And Run On The Mac Studio

```bash
npm install
npm run build
npm run start
```

If you want Turicum on a dedicated port behind OpenClaw, for example:

```bash
npx next start -p 3100
```

## Reverse Proxy Requirements

Your proxy should:

- forward `/turicum` to the Turicum process if mounted under the main domain
- preserve `Host` and `X-Forwarded-Proto`
- support websocket upgrade for local development if needed

## Important Current Caveat

Cases and core records are Supabase-backed, but borrower portal state is still local-file backed.

That means deployment is safe, but if you run Turicum on multiple machines at once, borrower portal updates can diverge until we move that layer into Supabase.

## Recommended Next Production Step

Move these into Supabase next:

- borrower portals
- borrower form responses
- signature requests
