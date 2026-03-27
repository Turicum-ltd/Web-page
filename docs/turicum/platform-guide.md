# Turicum LLC Platform Guide

## Purpose

Turicum LLC is the operating layer for real-estate deal execution under `marketshift.net/turicum`.

It is designed to coordinate three lanes at once:

- Borrower
- Turicum LLC
- Investor

Turicum LLC is not meant to replace Google Drive as the source of truth for documents. The intended split is:

- Google Drive stores source, working, and executed documents
- Turicum LLC stores workflow state, review gates, routing, case structure, and audit context

## Product model

Turicum LLC covers the full deal lifecycle:

1. Deal intake
2. Borrower packet collection
3. Borrower + property validation
4. Investor promotion
5. Template selection
6. Contract AI review
7. Legal review
8. Closing diligence
9. Signature / notary
10. Funding
11. Servicing + investor updates
12. Exit / payoff / rollover

The platform is intentionally state-aware and document-family-aware. Legal behavior should be driven by state packs and precedent analysis, not hardcoded page logic.

## Current actors

### Borrower

- Receives portal access
- Completes the first packet
- Uploads or links supporting documents
- Proceeds through execution and signatures

### Turicum LLC

- Structures the file
- Validates borrower and property
- Packages the case for investors
- Chooses the legal starting paper
- Runs AI review and legal review
- Tracks diligence, execution, funding, servicing, and exit

### Investor

- Receives promoted opportunity
- Reviews summary and structure
- Commits to the deal
- Receives updates during servicing
- Follows payoff / extension / rollover outcome

## Core workflow pages

### Case creation

Route:

- `/turicum/cases/new`

Purpose:

- Create the case
- Capture the first-call intake
- Set the initial workflow assumptions

The first-call borrower intake includes:

1. Requested amount
2. Asset / property address and description
3. Ownership / debt / lien picture, plus purchase and improvement history
4. Title-holding detail
5. Estimated value and value basis
6. Timing for when funds are needed

It also includes placeholders for:

- Credit check
- Background check
- Criminal check
- Whether the borrower will provide reports or Turicum will use an outside vendor

### Borrower intake workspace

Route:

- `/turicum/cases/[id]/intake`

Purpose:

- Assign forms
- Track borrower packet progress
- Prepare signature routing once the upstream gates are clear

This is the borrower-collection console for Turicum operations.

### Borrower portal

Route:

- `/turicum/borrower/[token]`

Purpose:

- Guided borrower-facing surface
- Form completion
- Pending/ready document visibility

### Borrower + property validation

Route:

- `/turicum/cases/[id]/validation`

Purpose:

- Internal validation checkpoint
- Keep the first-call answers visible
- Record the screening plan
- Approve or block investor promotion

Investor promotion cannot finalize unless this step is approved.

### Investor promotion

Route:

- `/turicum/cases/[id]/investor-promotion`

Purpose:

- Package the deal for investors
- Record promotion state
- Lock the final investor structure

This step is gated by:

- Borrower packet completion
- Borrower + property validation approval

### Template selection

Routes:

- `/turicum/library`
- `/turicum/library/templates`
- `/turicum/library/templates/[groupKey]`

Purpose:

- Choose the right legal starting point by state, structure, and document family
- Prefer stronger and newer precedents

Turicum now ranks newer documents ahead of older ones when the rest of the fit is comparable.

### Contract AI review

Route:

- `/turicum/cases/[id]/contract-ai-review`

Purpose:

- Generate issue list and review memo before counsel sign-off

### Legal review

Route:

- `/turicum/cases/[id]/legal-review`

Purpose:

- Human document-review gate
- Lawyer comments and signature approval

This gate is about paper quality and legal corrections.

### Closing diligence

Route:

- `/turicum/cases/[id]/closing-diligence`

Purpose:

- Separate execution gate for:
  - Title work
  - Insurance
  - Tax review

This is intentionally separate from legal document review.

Execution requires both:

- Legal review approval
- Closing diligence approval

### Funding

Route:

- `/turicum/cases/[id]/funding`

Purpose:

- Escrow
- Reserve structure
- Release conditions
- Funded status

Funding should not proceed as a loose postscript to signatures. It is its own control surface.

### Servicing

Route:

- `/turicum/cases/[id]/servicing`

Purpose:

- Monthly payment tracking
- Reserve balance
- Investor update cadence

### Exit / payoff / rollover

Route:

- `/turicum/cases/[id]/exit`

Purpose:

- Payoff
- Sale
- Refinance
- Extension
- Rollover

## Legal and diligence split

Turicum now uses two legal-adjacent gates:

### 1. Document review

Owned by:

- Legal counsel
- Turicum legal ops

Examples:

- Loan documents
- Closing instructions
- Guaranty
- Disclosures
- Authorizations

### 2. Closing diligence

Owned by:

- Title company or outside vendor
- Insurance / tax follow-up
- Turicum ops for tracking and gate control

Examples of title-agency or outside-vendor paper:

- Title commitment
- Marked-up title
- Title policy
- Settlement / closing statement
- Mortgage / deed of trust package
- Warranty deed

Examples of Turicum-owned paper:

- Core loan paper
- Closing instructions
- Borrower-facing execution prep
- Counsel-reviewed legal stack

## Google Drive strategy

Google Drive remains the document system of record.

Turicum should reference:

- Drive file IDs
- Drive folder IDs
- Linked Drive URLs

Turicum should avoid becoming the primary document store unless there is a specific product reason.

Current intended pattern:

- Source templates and precedents remain in Drive
- Case folders remain in Drive
- Executed docs remain in Drive
- Turicum stores links, workflow state, and readiness

## Persistence model

### Current state

Turicum still supports local JSON fallback for rapid local operation.

Examples:

- `data/cases.json`
- `data/borrower-portals.json`
- `data/case-legal-reviews.json`
- `data/case-closing-diligence.json`
- `data/case-funding-workflows.json`

### Direction

Turicum is being migrated toward Supabase for workflow state while keeping Google Drive for documents.

Current stateful areas already using or prepared for Supabase:

- Cases
- Case documents
- Checklist items
- Workflow-state table for review and lifecycle records

New shared workflow-state table:

- `atlas_case_workflow_state` (kept under the legacy name for Supabase compatibility)

This table is designed to store per-case JSON workflow payloads keyed by:

- `case_id`
- `workflow_type`

This lets Turicum move review and lifecycle state out of local files without forcing a huge all-at-once migration.

### Why this split makes sense

Supabase is good for:

- statuses
- gates
- approvals
- structured workflow state
- querying and dashboards

Google Drive is good for:

- source documents
- working files
- executed files
- external collaboration with non-Turicum participants

## Flow map

Route:

- `/turicum/flows`

The flow map is a planning and operating surface. It should show the lifecycle in three lanes:

- Borrower
- Turicum
- Investor

It is not just a diagram. It should support:

- step inspection
- operator notes
- print views
- presentation mode

The printable view lives at:

- `/turicum/flows/print`

## Hosting model

### Recommended short-term deployment

- Next.js app on a VPS
- PM2 or systemd
- reverse proxy
- Cloudflare Access in front of `/turicum`

Why:

- Turicum still has local fallback state
- Turicum has custom route/proxy behavior
- Turicum benefits from direct server control during iteration

### Recommended long-term deployment

- Turicum app server
- Supabase for workflow state
- Google Drive for documents
- Cloudflare for routing and access

## Operational dependencies

Turicum currently depends on:

- Next.js
- Node runtime
- PM2 in the current local deployment
- Cloudflare Access for private route protection
- Google Drive for document source of truth
- Supabase for structured persistence where enabled

## Current limitations

- Google signature flow is still tracked/prepared more than fully live API-driven
- Full document corpus sync from Google Drive is not always mounted locally
- Some workflow state still falls back to local JSON when Supabase is not configured
- Title / insurance / tax vendors are tracked as external participants, not full vendor portals

## Near-term roadmap

1. Continue moving workflow state into Supabase
2. Keep documents in Google Drive
3. Strengthen Drive references across all operational pages
4. Complete Google signature integration for non-notary files
5. Add clearer vendor assignment for title / insurance / tax
6. Tighten template ranking and review visibility in the legal library

## Practical operating principle

Turicum should answer:

- What is this deal?
- What do we still need?
- Who owns the next step?
- Which gate is blocking progress?
- Which documents are the active source of truth?
- What happened after close?

If a page does not help answer one of those questions, it should be simplified or removed.
