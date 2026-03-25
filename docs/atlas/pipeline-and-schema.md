# Atlas Pipeline And Schema

## Product Shape

Atlas v1 is a lean operating platform for:

- deal intake
- screening
- due diligence
- legal packet assembly
- closing tracking
- manual payment tracking after closing

The app should be a single system with one shared workflow and a configurable state-pack layer.

## Pipeline

### 1. Lead Intake

Capture:

- source type: `direct`, `referral_partner`, `mca`, `investor`, `other`
- property address
- requested amount
- estimated value
- existing debt
- borrower entity status
- asset summary

### 2. Screening

Apply handbook rules:

- supported state
- minimum size
- asset class fit
- target LTV fit
- existing lien feasibility
- structure viability

Output:

- `qualified`
- `qualified_with_questions`
- `declined`

### 3. Structure Selected

Select:

- `loan`
- `purchase`

This decision drives the state pack, the checklist, and the required documents.

### 4. Term Sheet

Generate and track:

- sent date
- signed date
- expiration
- exclusivity period
- deposit required

### 5. Deposit Received

Track manually:

- expected amount
- received amount
- received date
- wire reference
- cleared status

### 6. Due Diligence

Checklist-driven collection:

- application
- authorizations
- IDs
- lien payoffs
- tax returns
- leases / rent rolls
- insurance
- entity docs
- title / prior closing docs

### 7. Packet Build

Atlas should assemble the case packet using:

- selected state pack
- structure type
- required document matrix
- uploaded files
- template references

### 8. Legal Review

Track:

- draft complete
- counsel review
- internal review
- approved to sign

### 9. Signing

Track:

- sent for signature
- partially signed
- fully signed
- exceptions

### 10. Closing

Track:

- closing date
- executed packet complete
- closing statement complete
- recorded docs pending / complete

### 11. Servicing

In v1, payments remain manual:

- payment schedule
- payment entries
- overdue flags
- maturity tracking

## Status Model

### Case Status

- `lead`
- `screening`
- `awaiting_structure`
- `term_sheet_sent`
- `awaiting_deposit`
- `due_diligence_open`
- `packet_in_progress`
- `legal_review`
- `awaiting_signatures`
- `ready_to_close`
- `closed_active`
- `servicing`
- `matured`
- `declined`
- `cancelled`

### Document Status

- `missing`
- `not_required`
- `placeholder_only`
- `draft`
- `uploaded`
- `under_review`
- `approved`
- `signed`
- `recorded`
- `final`
- `superseded`

### Checklist Status

- `not_started`
- `requested`
- `received`
- `reviewed`
- `waived`
- `rejected`

## Core Entity Model

### `cases`

One row per real deal / closing matter.

Key fields:

- `id`
- `case_code`
- `title`
- `state`
- `structure_type`
- `state_pack_code`
- `state_pack_version`
- `stage`
- `status`
- `source_type`
- `property_id`
- `headline_value`
- `requested_amount`
- `estimated_value`
- `existing_debt`
- `created_at`
- `updated_at`

### `properties`

- `id`
- `name`
- `street`
- `city`
- `state`
- `postal_code`
- `county`
- `property_type`
- `units`
- `square_feet`
- `notes`

### `contacts`

- `id`
- `type`
- `name`
- `email`
- `phone`
- `address_line_1`
- `city`
- `state`
- `postal_code`
- `notes`

### `case_contacts`

- `id`
- `case_id`
- `contact_id`
- `role_on_case`
- `is_primary`

### `state_packs`

- `id`
- `state_code`
- `version`
- `is_active`
- `support_level`
- `notes`

### `document_types`

Master list of document families.

Examples:

- `term_sheet`
- `application`
- `borrower_authorization`
- `promissory_note`
- `mortgage`
- `purchase_agreement`
- `option_agreement`
- `lease_agreement`
- `warranty_deed`
- `closing_statement`
- `closing_instructions`
- `final_title_policy`
- `insurance_certificate`
- `ach_authorization`

### `state_pack_documents`

Defines what a state pack requires.

- `id`
- `state_pack_id`
- `structure_type`
- `document_type_id`
- `category`
- `required_stage`
- `requirement_level`
- `notes`

### `templates`

Tracks reusable legal or business templates.

- `id`
- `state`
- `structure_type`
- `document_type_id`
- `title`
- `storage_path`
- `template_kind`
- `version`
- `is_active`
- `review_status`

`template_kind` should distinguish:

- `template`
- `precedent`
- `supporting_example`

### `case_documents`

Actual files attached to a case.

- `id`
- `case_id`
- `document_type_id`
- `template_id`
- `status`
- `category`
- `storage_path`
- `uploaded_at`
- `recorded_at`
- `supersedes_document_id`

### `case_checklist_items`

- `id`
- `case_id`
- `state_pack_document_id`
- `status`
- `requested_at`
- `received_at`
- `reviewed_at`
- `notes`

### `term_sheets`

- `id`
- `case_id`
- `status`
- `sent_at`
- `signed_at`
- `expiration_date`
- `deposit_required`

### `payment_schedules`

- `id`
- `case_id`
- `label`
- `due_date`
- `expected_amount`
- `status`

### `payments`

- `id`
- `case_id`
- `payment_schedule_id`
- `received_date`
- `received_amount`
- `payment_method`
- `bank_reference`
- `notes`

## Document Taxonomy

Atlas should keep each document typed by:

- `document_type`
- `category`
- `state`
- `structure_type`
- `template_kind`
- `status`

This is the key to keeping the legal library searchable and reusable.

## Folder And Storage Rules

Even if Atlas stores files in Supabase Storage or S3, the UI should mirror the real-world folder model:

- `01 Core Legal`
- `02 Closing - Settlement`
- `03 Title - Recorded`
- `04 Entity - JV`
- `05 Funding - Escrow`
- `06 Insurance - Support`
- `07 Photos - Market Data`
- `99 Archive`

That keeps the digital system aligned with the team's actual operating habits.

## Extension Rules

To add a new state later:

1. create a new `state_pack`
2. load `state_pack_documents`
3. attach legal templates or precedents
4. activate the pack

No case table or workflow redesign should be needed.
