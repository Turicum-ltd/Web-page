## Turicum Surface Ownership

This repo now has two distinct product lanes.

### Main Turicum App

The main Next.js app owns:

- `https://turicum.us/`
- `https://turicum.us/investors`
- `https://turicum.us/investor-handoff`
- `https://turicum.us/access`
- `https://turicum.us/review`
- `https://turicum.us/cases`

This is the investor, admin, and internal operations surface.

### Borrower App

The standalone borrower app lives in:

- `apps/borrower-portal`

It owns:

- `https://borrow.turicum.us/`
- `https://borrow.turicum.us/apply/[token]`

This is the borrower-only intake surface.

### Redirect Boundary

The main-app `/portal` route is only a redirect shim to the borrower app.

Do not build new borrower UI in the main app.

### Borrower Data Flow

The live borrower intake flow is:

1. Borrower submits quick asset intake on `borrow.turicum.us`
2. Submission is saved to `pre_intake_leads`
3. Staff reviews and updates the lead in `/access`
4. Staff generates or emails a secure application link
5. Borrower finishes the full commercial loan application at `/apply/[token]`

### Investor Data Flow

The live investor path is:

1. Public landing page opens the investor access gate
2. Prospect completes the request-access suitability flow on `/investors`
3. Staff issues credentials and case access in `/access`
4. Investor logs in through `/investors`

### Cleanup Rule

If a feature is borrower-facing, it belongs in `apps/borrower-portal` unless it is strictly an admin handoff or reporting surface.
