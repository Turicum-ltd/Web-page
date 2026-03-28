# Turicum LLC DigitalOcean Dry Run

This directory contains the production handoff files for moving Turicum LLC from the Mac Studio environment to a DigitalOcean VPS.

## Files

- `nginx-turicum.conf`: reverse-proxy template for the dedicated `turicum.us` host
- `ecosystem.config.cjs`: PM2 app definition for the Turicum Next runtime
- `.env.production.example`: baseline environment template for production

## Dry-run order

1. Copy the application to `/opt/turicum-platform`
2. Copy `.env.production.example` to `.env.production` and fill real values
3. Make sure `.env.production` includes the Supabase values for the canonical Turicum project:
   - `SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. PM2 loads `/opt/turicum-platform/.env.production` automatically via `deploy/digitalocean/ecosystem.config.cjs`
5. Run `npm install`
6. Run `npm run build`
7. Start the app with PM2 using `ecosystem.config.cjs`
8. Run `scripts/check-digitalocean-cutover.sh http://localhost:3100`
9. After nginx is in front, repeat route checks against the public origin

## Route model

- `/`: public-facing Turicum landing page
- `/portal`: public-safe portal
- `/team-login`: internal staff sign-in
- `/investor-handoff`: investor-safe summary surface
- `/investors`: secure investor login portal
- `/review`: integrated review surface
- `/cases`, `/flows`, `/library`, `/state-packs`: protected team routes
- `/turicumold`: optional legacy alias that should proxy to `/`

## Notes

- Keep documents in Google Drive.
- Use Supabase for shared workflow state when enabled.
- The interim wordmark is asset-based, so the final logo can replace it without touching page code.
- Staff and investor sign-in now depend on Supabase-issued accounts and role rows in `turicum_user_profiles`.
- `package.json` pins the app to Node 22 for production.
