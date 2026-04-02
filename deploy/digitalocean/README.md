# Turicum LLC DigitalOcean Dry Run

This directory contains the production handoff files for running Turicum LLC on a DigitalOcean VPS.

## Files

- `nginx-turicum.conf`: reverse-proxy template for `turicum.us` and `borrow.turicum.us`
- `ecosystem.config.cjs`: PM2 app definition for the main Turicum runtime and the borrower portal
- `.env.production.example`: baseline environment template for the main Turicum app

## Dry-run order

1. Copy the application to `/opt/turicum-platform`
2. Copy `.env.production.example` to `/opt/turicum-platform/.env.production` and fill real values
3. Copy `apps/borrower-portal/.env.local.example` to `/opt/turicum-platform/apps/borrower-portal/.env.production` and fill real values
4. Make sure both env files include the Supabase values for the canonical Turicum project:
   - `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. PM2 loads `/opt/turicum-platform/.env.production` and `/opt/turicum-platform/apps/borrower-portal/.env.production` automatically via `deploy/digitalocean/ecosystem.config.cjs`
6. Run `npm install`
7. Run `npm run build`
8. Run `npm run build:borrower-portal`
9. Start both apps with PM2 using `ecosystem.config.cjs`
10. Run `scripts/check-digitalocean-cutover.sh http://localhost:3100`
11. Check `http://localhost:3200`
12. After nginx is in front, repeat route checks against both public origins

## Route model

- `/`: public-facing Turicum landing page
- `/portal`: redirect to `https://borrow.turicum.us`
- `borrow.turicum.us`: standalone borrower portal
- `/team-login`: internal staff sign-in
- `/investor-handoff`: investor-safe summary surface
- `/investors`: secure investor login portal
- `/review`: integrated review surface
- `/cases`, `/flows`, `/library`, `/state-packs`: protected team routes
- `/turicumold`: optional legacy alias that should proxy to `/`

## Notes

- Keep documents in Google Drive.
- Use Supabase for shared workflow state when enabled.
- Borrower intro requests and commercial loan applications should use the same Supabase project as the main Turicum app.
- The interim wordmark is asset-based, so the final logo can replace it without touching page code.
- Staff and investor sign-in now depend on Supabase-issued accounts and role rows in `turicum_user_profiles`.
- `package.json` pins the app to Node 22 for production.
