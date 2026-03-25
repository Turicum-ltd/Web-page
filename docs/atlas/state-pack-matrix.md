# Atlas State-Pack Matrix

## Goal

Atlas should use a configurable `state-pack` model:

- one universal case workflow
- one shared document taxonomy
- state-specific requirements loaded from configuration

This lets the team launch with `FL`, `IN`, `OH`, and `TX`, then add more states without rewriting core application logic.

## Structures

Atlas v1 should support these structures:

- `loan`: traditional loan workflow
- `purchase`: purchase / option / sale-leaseback style workflow

Each case should select:

- `state`
- `structure_type`
- `state_pack_version`

## Shared Document Categories

These categories should mirror the real closing folders already in use:

| Category | Folder | Purpose |
| --- | --- | --- |
| `core_legal` | `01 Core Legal` | Executed core legal agreements |
| `closing_settlement` | `02 Closing - Settlement` | Closing statements, escrow, settlement packages |
| `title_recorded` | `03 Title - Recorded` | Deeds, mortgages, title policies, recorded docs |
| `entity_jv` | `04 Entity - JV` | Entity, authority, JV, investor docs |
| `funding_escrow` | `05 Funding - Escrow` | ACH, wire, funding and instructions |
| `insurance_support` | `06 Insurance - Support` | COIs, dec pages, supporting backup |
| `market_data` | `07 Photos - Market Data` | Photos, comps, market support |
| `archive` | `99 Archive` | Deprecated, duplicate, or superseded items |

## Shared Case Stages

All states should use the same high-level stages:

1. `lead_intake`
2. `screening`
3. `structure_selected`
4. `term_sheet`
5. `deposit_received`
6. `due_diligence`
7. `packet_build`
8. `legal_review`
9. `signing`
10. `closing`
11. `servicing`
12. `closed`
13. `declined`

## State Pack Summary

| State | Phase 1 Support | Primary Source Material | Recommended Initial Confidence | Notes |
| --- | --- | --- | --- | --- |
| `FL` | Yes | Strong extracted precedent set | High | Best-supported purchase / option style packet library |
| `TX` | Yes | Good extracted purchase precedent set | Medium-High | Good for purchase packet design, lighter corpus than FL |
| `IN` | Yes | Handbook + legal review needed | Medium-Low | Build checklist and placeholders first, then attach legal-reviewed docs |
| `OH` | Yes | Handbook + legal review needed | Medium-Low | Same rollout strategy as IN |

## Document Matrix

Legend:

- `R`: required
- `O`: optional
- `-`: not part of standard packet
- `P`: placeholder until legal-reviewed state documents are loaded

### Loan

| Document Type | Category | Stage | FL | TX | IN | OH | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Term sheet | `core_legal` | `term_sheet` | R | R | R | R | Generated from case data |
| Borrower authorization | `core_legal` | `due_diligence` | R | R | R | R | From handbook checklist |
| Commercial application | `core_legal` | `due_diligence` | R | R | R | R | One per guarantor when applicable |
| Guarantor IDs | `core_legal` | `due_diligence` | R | R | R | R | Driver licenses and spouse if applicable |
| Entity formation docs | `entity_jv` | `due_diligence` | R | R | R | R | LLC / corporation borrower only |
| Insurance certificate / dec page | `insurance_support` | `due_diligence` | R | R | R | R | Coverage and agent contact required |
| Lien payoffs / satisfactions | `core_legal` | `due_diligence` | R | R | R | R | Required when debt exists |
| Use of funds breakdown | `core_legal` | `due_diligence` | R | R | R | R | Checklist item from handbook |
| Title order / title commitment | `title_recorded` | `packet_build` | R | R | R | R | Order before closing |
| Valuation / BPO / appraisal | `market_data` | `packet_build` | R | R | R | R | One required valuation path |
| Promissory note | `core_legal` | `legal_review` | R | R | P | P | State-specific legal template |
| Mortgage / deed of trust | `title_recorded` | `legal_review` | R | R | P | P | Varies by state recording practice |
| Personal guaranty | `core_legal` | `legal_review` | R | R | P | P | Common for entity borrower |
| Lender closing instructions | `funding_escrow` | `legal_review` | O | O | P | P | Strong precedent in TX and WA corpus |
| Closing statement | `closing_settlement` | `closing` | R | R | R | R | Final settlement record |
| Recorded mortgage / lien | `title_recorded` | `closing` | R | R | P | P | Post-closing recorded artifact |
| Final title policy | `title_recorded` | `closing` | O | O | P | P | Often post-closing |
| ACH / payment authorization | `funding_escrow` | `servicing` | O | O | O | O | Useful later, not required in manual-payment MVP |

### Purchase / Option / SLB

| Document Type | Category | Stage | FL | TX | IN | OH | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Term sheet | `core_legal` | `term_sheet` | R | R | R | R | Generated from case data |
| Rejection letter for loan path | `core_legal` | `structure_selected` | O | O | P | P | Required when converting to SLB flow |
| Purchase agreement | `core_legal` | `legal_review` | R | R | P | P | State-sensitive template |
| Option agreement / repurchase option | `core_legal` | `legal_review` | R | R | P | P | Strong FL / TX precedent |
| Lease agreement | `core_legal` | `legal_review` | R | O | P | P | Common in FL lease-option packets |
| Warranty deed | `title_recorded` | `closing` | R | R | P | P | Executed and later recorded |
| Recorded deed | `title_recorded` | `closing` | R | R | P | P | Post-closing recorded artifact |
| Title order / title commitment | `title_recorded` | `packet_build` | R | R | R | R | Required |
| Marked-up title / title review | `title_recorded` | `packet_build` | O | O | P | P | Present in FL / TX precedent |
| JV / investor agreement | `entity_jv` | `legal_review` | R | R | P | P | Strong recurring precedent family |
| Entity operating agreement / authority | `entity_jv` | `due_diligence` | R | O | R | R | Required where buyer / holding LLC used |
| Closing instructions | `funding_escrow` | `legal_review` | O | R | P | P | Seen in FL / TX closings |
| Closing statement | `closing_settlement` | `closing` | R | R | R | R | Required |
| Insurance certificate / dec page | `insurance_support` | `due_diligence` | O | O | O | O | Often present in purchase sets |
| ACH / recurring payment authorization | `funding_escrow` | `servicing` | O | O | O | O | Not required for manual-payment MVP |
| Borrower / seller acknowledgment | `core_legal` | `signing` | O | O | P | P | Especially helpful in SLB-style transactions |
| Affidavit / state-specific rider | `core_legal` | `signing` | O | O | P | P | State-specific document family |

## Recommended Rollout

### Wave 1

- `FL purchase`
- `TX purchase`
- `FL loan`
- `TX loan`

These should be the first usable state packs because the real precedent corpus is strongest here.

### Wave 2

- `IN loan`
- `IN purchase`
- `OH loan`
- `OH purchase`

These should be implemented using the same engine and checklist model, but marked `provisional` until legal-reviewed templates are attached.

## Rules For Adding New States

Every new state should be added by creating a new state pack with:

- `state`
- `version`
- `supported_structures`
- `required_documents`
- `optional_documents`
- `checklist_items`
- `closing_rules`
- `template_refs`

Do not add new states by:

- branching app logic by state
- creating new tables per state
- hardcoding document rules into UI components

## Open Gaps

Before production use, confirm with counsel:

- final legal template set for `IN`
- final legal template set for `OH`
- whether `purchase` in Atlas maps to `SLB`, `option`, or both in each state
- exact recorded instrument expectations by state for loan and purchase structures
