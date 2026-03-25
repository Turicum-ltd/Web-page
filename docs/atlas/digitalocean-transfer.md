# Turicum LLC DigitalOcean Transfer

## Purpose

This note is the deployment handoff for moving the Turicum LLC platform from the Mac Studio / OpenClaw environment to a DigitalOcean VPS while keeping Google Drive as the document system of record.

The hosted shape should preserve the current split:

- external landing page at `/atlas`
- public-safe portal at `/atlas/portal`
- investor-safe handoff at `/atlas/investor-handoff`
- integrated review surface at `/atlas/review`
- optional legacy alias at `/atlasold` pointing to `/atlas`
- Google Drive for documents
- Supabase as the long-term workflow-state target

## Recommended hosting shape

- one DigitalOcean droplet
- Ubuntu LTS
- `node` + `npm`
- `pm2` for process management
- `nginx` in front of the app
- Cloudflare continuing to handle DNS and Access

This keeps the current application model intact while making it easier to cut over from the Mac Studio to a VPS without redesigning the product surface.

## Product surface logic

### `/atlas` is the external-facing landing page

`/atlas` should be the public-facing Turicum entry point.

It should make the product legible for:

- borrowers
- investors
- the Turicum team

The root should explain the lifecycle clearly and route each audience to the right surface without reading like an internal dashboard.

### `/atlas/review` is the integrated review surface

`/atlas/review` should remain the internal review page.

It carries:

- lifecycle review
- current blockers
- transfer readiness
- links into protected casework and supporting surfaces

### `/atlas/portal` is the public-safe portal

`/atlas/portal` should explain the Turicum process clearly enough that each audience knows where they start without exposing internal controls.

#### Borrowers

Borrowers should understand:

- there is a first call and first-pass intake
- Turicum LLC opens a secure borrower packet after initial qualification
- supporting documents and signatures happen later in the process, not first

#### Investors

Investors should understand:

- Turicum validates borrower and property information first
- investor promotion happens after validation
- the promoted deal determines whether the structure is one investor or several
- investor updates continue through servicing and exit

### `/atlas/investor-handoff` is the investor-safe summary surface

This route should remain investor-safe and avoid exposing internal workspace behavior.

It should explain:

- promoted deal summary
- final structure and investor count
- servicing/update cadence
- payoff / exit / rollover visibility

### `/atlasold` is only a legacy alias

If retained, `/atlasold` should resolve to `/atlas` through nginx or the external proxy layer. It should not be treated as the conceptual primary product surface anymore.

## Documents vs workflow state

### Google Drive

Keep Google Drive as the source of truth for:

- source legal documents
- working legal drafts
- borrower-supporting documents
- title / insurance / tax support files
- signed and archived deal documents

### Turicum LLC app

Use the application to manage:

- case records
- borrower intake and validation state
- investor promotion state
- legal review and closing-diligence gates
- funding, servicing, and exit workflows
- links and references back to Drive files and folders

### Supabase

Use Supabase for workflow state as the long-term target:

- case workflow state
- review state
- promotion / funding / servicing / exit state
- shared persistence across environments

Local JSON fallback can remain available during transition, but it should not be the long-term production plan.

## Brand asset handling

The interim wordmark remains easy to replace.

Current shared assets:

- `/atlas/brand/turicum-wordmark.svg`
- `/atlas/brand/turicum-wordmark-compact.svg`

That means the final logo can replace the interim brand without rewriting multiple pages.

## Deployment artifacts in the repo

- `deploy/digitalocean/nginx-turicum.conf`
- `deploy/digitalocean/ecosystem.config.cjs`
- `deploy/digitalocean/.env.production.example`
- `deploy/digitalocean/README.md`
- `scripts/check-digitalocean-cutover.sh`

## Deployment topology

### Public surface

- `/atlas`
  - public-facing Turicum landing page
- `/atlas/portal`
  - app-backed Turicum LLC public portal
- `/atlas/investor-handoff`
  - investor-safe summary page
- `/atlasold`
  - optional legacy alias to `/atlas`

### Protected surface

- `/atlas/review`
  - integrated review surface
- `/atlas/cases`
  - protected Turicum LLC workspace

### Reverse proxy

- `nginx` or the existing MarketShift server forwards `/atlas` traffic to the app process
- `/atlasold` can be preserved as an alias but should resolve to `/atlas`

## Environment variables

Minimum expected environment:

```bash
NODE_ENV=production
PORT=3100
ATLAS_BASE_PATH=/atlas
NEXT_PUBLIC_BASE_PATH=/atlas
APP_ORIGIN=https://marketshift.net
NEXT_PUBLIC_APP_ORIGIN=https://marketshift.net
```

If Supabase is enabled:

```bash
SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=atlas-documents
```

## Build and runtime

From the project root:

```bash
npm install
npm run build
npm run start
```

Recommended PM2 process:

```bash
pm2 start deploy/digitalocean/ecosystem.config.cjs
pm2 save
```

## Nginx outline

Use a location block that preserves the `/atlas` route:

```nginx
location /atlas/ {
  proxy_pass http://127.0.0.1:3100/atlas/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Keep the legacy public alias app-backed if you still want it:

```nginx
location = /atlasold {
  proxy_pass http://127.0.0.1:3100/atlas;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Dry-run checklist

1. Copy the app to the droplet.
2. Copy `deploy/digitalocean/.env.production.example` to a real production env file and fill values.
3. Run `npm install`.
4. Run `npm run build`.
5. Start the app under PM2 using `deploy/digitalocean/ecosystem.config.cjs`.
6. Run `scripts/check-digitalocean-cutover.sh http://127.0.0.1:3100`.
7. Put nginx in front.
8. Re-run route checks against the host or origin URL.
9. Confirm Google Drive links still open correctly.
10. Confirm workflow state writes either to Supabase or to the temporary local JSON fallback.
11. Point Cloudflare / origin routing to the DigitalOcean VPS.

## What still needs tightening before long-term production

- move more workflow state off local JSON and into Supabase
- keep document binaries in Google Drive, not local disk
- add deployment health checks for:
  - app upstream
  - proxy route
  - PM2 process count
- add backup / restore notes for any temporary JSON fallback state

## Operator note

The clean target is:

- Google Drive for documents
- Supabase for workflow state
- DigitalOcean for application hosting

That gives Turicum LLC a stable hosted app without forcing a document migration away from Drive.
