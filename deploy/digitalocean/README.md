# Turicum LLC DigitalOcean Dry Run

This directory contains the production handoff files for moving Turicum LLC from the Mac Studio environment to a DigitalOcean VPS.

## Files

- `nginx-turicum.conf`: reverse-proxy template preserving `/turicum`
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

- `/turicum`: public-facing Turicum landing page
- `/turicum/portal`: public-safe portal
- `/turicum/team-login`: internal staff sign-in
- `/turicum/investor-handoff`: investor-safe summary surface
- `/turicum/investors`: secure investor login portal
- `/turicum/review`: integrated review surface
- `/turicum/cases`, `/turicum/flows`, `/turicum/library`, `/turicum/state-packs`: protected team routes
- `/turicumold`: optional legacy alias that should proxy to `/turicum`

## Notes

- Keep documents in Google Drive.
- Use Supabase for shared workflow state when enabled.
- The interim wordmark is asset-based, so the final logo can replace it without touching page code.
- Rotate the default team and investor review credentials before production cutover.
