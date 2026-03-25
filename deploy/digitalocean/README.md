# Turicum LLC DigitalOcean Dry Run

This directory contains the production handoff files for moving Turicum LLC from the Mac Studio environment to a DigitalOcean VPS.

## Files

- `nginx-turicum.conf`: reverse-proxy template preserving `/atlas`
- `ecosystem.config.cjs`: PM2 app definition for the Turicum Next runtime
- `.env.production.example`: baseline environment template for production

## Dry-run order

1. Copy the application to `/opt/turicum-platform`
2. Copy `.env.production.example` to `.env.production` and fill real values
3. Run `npm install`
4. Run `npm run build`
5. Start the app with PM2 using `ecosystem.config.cjs`
6. Run `scripts/check-digitalocean-cutover.sh http://localhost:3100`
7. After nginx is in front, repeat route checks against the public origin

## Route model

- `/atlas`: public-facing Turicum landing page
- `/atlas/portal`: public-safe portal
- `/atlas/team-login`: internal staff sign-in
- `/atlas/investor-handoff`: investor-safe summary surface
- `/atlas/investors`: secure investor login portal
- `/atlas/review`: integrated review surface
- `/atlas/cases`, `/atlas/flows`, `/atlas/library`, `/atlas/state-packs`: protected team routes
- `/atlasold`: optional legacy alias that should proxy to `/atlas`

## Notes

- Keep documents in Google Drive.
- Use Supabase for shared workflow state when enabled.
- The interim wordmark is asset-based, so the final logo can replace it without touching page code.
- Rotate the default team and investor review credentials before production cutover.
