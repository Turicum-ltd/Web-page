# Turicum LLC GitHub Transfer Prep

## Current status

The Turicum LLC project folder is not currently a git repository.

That means the codebase can be prepared locally for transfer, but a GitHub push should wait until:

1. the GitHub login/account is changed to the correct owner
2. a new repository is created under that account

## What is already ready locally

- DigitalOcean deployment artifacts are in `deploy/digitalocean/`
- public and internal route split is defined
- public routes and protected team routes are separated
- Google Drive remains the document system of record
- Supabase can hold shared workflow state when enabled

## Before creating the new GitHub repo

1. Confirm the target GitHub account/login.
2. Confirm whether the repo should be private.
3. Confirm whether the repository name should stay `turicum-platform` or similar.
4. Review environment variables and remove any local-only secrets.
5. Decide whether investor review credentials should be rotated before the first push.

## Recommended `.gitignore` coverage

Make sure the repo excludes:

- `.next`
- `node_modules`
- local env files
- local storage
- transient workflow data and session files

## After the GitHub login is changed

Run this from the project root:

```bash
git init
git checkout -b main
git add .
git commit -m "Prepare Turicum LLC platform for DigitalOcean transfer"
git remote add origin <new-github-repo-url>
git push -u origin main
```

## Final pre-push review

- confirm public page content is correct
- confirm internal routes are team-gated
- confirm `/turicum/team-login` works and redirects back correctly
- confirm investor portal login works
- confirm borrower intro-call path works
- confirm deployment files are current
- confirm no local-only test data is staged
