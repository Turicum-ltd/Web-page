# Atlas Lean MVP Build Plan

## Recommended Stack

Keep v1 as simple as possible:

- `Next.js`
- `TypeScript`
- `Tailwind`
- `Supabase Postgres`
- `Supabase Auth`
- `Supabase Storage`
- `Resend`

Avoid in v1:

- microservices
- custom workflow engine
- automated bank sync
- advanced OCR
- payment processor integration
- state-specific code branches

## Build Order

### Phase 0: Foundation

- set up project repo
- set up auth and roles
- create base database schema
- create document taxonomy
- load starter state packs for `FL`, `TX`, `IN`, `OH`

### Phase 1: Core Intake

- create contacts module
- create properties module
- create case creation flow
- capture lead source and basic screening fields
- support `loan` and `purchase` structure selection

### Phase 2: Checklist And Packet Engine

- generate checklist from selected state pack
- show required vs optional docs
- support file uploads by document type
- show packet completeness by stage

### Phase 3: Term Sheet And Legal Library

- store and version term sheet templates
- generate case-specific term sheets
- add template registry for legal precedents
- distinguish `template`, `precedent`, and `supporting_example`

### Phase 4: Closing Workflow

- track legal review
- track signatures
- track closing readiness
- track closing statements and recorded documents

### Phase 5: Servicing

- create payment schedule
- support manual payment entry
- flag overdue items
- show maturity and outstanding balance

## Suggested Milestones

### Milestone 1

Usable internal pipeline with:

- cases
- contacts
- properties
- state packs
- checklist generation

### Milestone 2

Document-driven closings with:

- uploads
- packet completeness
- term sheets
- template registry

### Milestone 3

Operational v1 with:

- closing status tracking
- manual payment tracking
- reporting dashboard

## Immediate Next Tasks

1. Turn the state-pack JSON files into database seed data.
2. Build the first UI around `cases`, `checklists`, and `documents`.
3. Load the FL and TX precedents into the template registry.
4. Mark IN and OH templates as provisional until reviewed by counsel.

## Definition Of Done For MVP

Atlas v1 is ready when the team can:

- open a case in `FL`, `TX`, `IN`, or `OH`
- choose `loan` or `purchase`
- auto-generate the required checklist
- upload and classify documents into the right categories
- track term sheet, due diligence, legal review, closing, and servicing
- record manual bank payments against a case
