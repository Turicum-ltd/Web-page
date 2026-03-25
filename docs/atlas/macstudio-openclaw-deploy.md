# Atlas Deployment To Mac Studio / OpenClaw

## Goal

Move Atlas as it stands to the Mac Studio and make it available behind your MarketShift infrastructure.

## Recommended Deployment Shape

### Best first step

Deploy Atlas as its own app process first, then mount it into MarketShift after validation.

Recommended order:

1. `atlas.marketshift.net` or an internal hostname first
2. then `marketshift.net/atlas`

Atlas is now base-path aware, so it can be built with `ATLAS_BASE_PATH=/atlas` when you are ready to mount it under the main site.

## Packaging The App

From the Atlas project root run:

```bash
./scripts/package-atlas.sh
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

Atlas currently supports:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=atlas-documents
ATLAS_BASE_PATH=/atlas
APP_ORIGIN=https://marketshift.net
NEXT_PUBLIC_BASE_PATH=/atlas
NEXT_PUBLIC_APP_ORIGIN=https://marketshift.net
```

### If running as a subdomain first

Use:

```bash
ATLAS_BASE_PATH=
APP_ORIGIN=https://atlas.marketshift.net
NEXT_PUBLIC_BASE_PATH=
NEXT_PUBLIC_APP_ORIGIN=https://atlas.marketshift.net
```

### If running under `marketshift.net/atlas`

Use:

```bash
ATLAS_BASE_PATH=/atlas
APP_ORIGIN=https://marketshift.net
NEXT_PUBLIC_BASE_PATH=/atlas
NEXT_PUBLIC_APP_ORIGIN=https://marketshift.net
```

## Install And Run On The Mac Studio

```bash
npm install
npm run build
npm run start
```

If you want Atlas on a dedicated port behind OpenClaw, for example:

```bash
npx next start -p 3100
```

## Reverse Proxy Requirements

Your proxy should:

- forward `/atlas` to the Atlas process if mounted under the main domain
- preserve `Host` and `X-Forwarded-Proto`
- support websocket upgrade for local development if needed

## Important Current Caveat

Cases and core records are Supabase-backed, but borrower portal state is still local-file backed.

That means deployment is safe, but if you run Atlas on multiple machines at once, borrower portal updates can diverge until we move that layer into Supabase.

## Recommended Next Production Step

Move these into Supabase next:

- borrower portals
- borrower form responses
- signature requests
