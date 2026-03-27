# Turicum Template Registry Plan

## Goal

Turicum should treat the extracted legal corpus as a structured library, not a loose file dump.

Each file should be classified into one of three kinds:

- `template`: reusable base document intended for generation
- `precedent`: executed or near-executed example used as a model
- `supporting_example`: related support material such as title, insurance, or instructions

## Why This Matters

The extracted corpus already shows repeating document families across states and structures. If Turicum stores only file names, the library will become hard to search and hard to reuse.

The registry should make it possible to answer:

- what documents are usually required for a `TX purchase` case?
- do we already have an executed `FL option agreement` example?
- which docs are still missing for `IN loan`?
- which files are state-specific versus reusable drafting references?

## Recommended Metadata

Each registry row should store:

- `title`
- `document_type`
- `template_kind`
- `state`
- `structure_type`
- `case_name`
- `source_case_code`
- `storage_path`
- `status`
- `effective_date`
- `is_executed`
- `is_recorded`
- `review_status`
- `notes`

## Initial Ingestion Strategy

### 1. Start With FL And TX

Use the extracted corpus to load:

- `FL purchase` precedents
- `TX purchase` precedents

These have the strongest document coverage and will give Turicum a usable starting library.

### 2. Keep IN And OH Provisional

For `IN` and `OH`:

- create required document slots
- leave legal documents as placeholders
- attach reviewed templates later

### 3. Classify By Document Family

At minimum, the following types should exist in the registry:

- `term_sheet`
- `commercial_application`
- `borrower_authorization`
- `promissory_note`
- `mortgage`
- `mortgage_modification`
- `purchase_agreement`
- `option_agreement`
- `lease_agreement`
- `warranty_deed`
- `closing_statement`
- `closing_package`
- `closing_instructions`
- `title_commitment`
- `title_policy`
- `marked_up_title`
- `jv_agreement`
- `disposition_agreement`
- `operating_agreement`
- `articles_of_organization`
- `insurance_certificate`
- `payment_authorization`
- `wiring_instructions`
- `acknowledgment`
- `affidavit`

## Suggested Naming Rules

Store canonical document names as:

`{state}_{structure}_{document_type}_{version}`

Examples:

- `FL_purchase_option_agreement_v1`
- `TX_purchase_closing_statement_v1`
- `IN_loan_promissory_note_v1`

The original file name should still be preserved separately.

## Review Workflow

Every legal drafting file should have a `review_status`:

- `unreviewed`
- `ops_approved`
- `counsel_reviewed`
- `production_ready`

Only `production_ready` templates should be available for case generation.

## Recommended First Import Set

Import these precedent families first:

- `FL purchase`: option agreement, lease agreement, warranty deed, JV agreement, closing statement, title docs
- `TX purchase`: option agreement, warranty deed, JV agreement, closing instructions, closing statement
- `WA loan precedent`: note, mortgage, modification, title, closing package

The WA loan file set is still useful as a loan precedent family even if Phase 1 support is centered on FL, IN, OH, and TX.
