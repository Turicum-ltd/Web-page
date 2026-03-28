# Turicum LLC Project Foundation

This folder captures the working product and implementation blueprint for `turicum.us`, branded as Turicum LLC.

The current target is a lean MVP for real-estate deal operations with:

- deal intake and screening
- state-aware case management
- document packet management
- contract and closing workflow
- manual payment tracking against a regular bank account

Phase 1 supports:

- `FL`
- `IN`
- `OH`
- `TX`

The design is intentionally extensible. State-specific legal and closing behavior should be added through `state packs`, not hardcoded into application logic.

## Documents in this folder

- `platform-guide.md`: full platform overview, workflow map, data model direction, Google Drive strategy, and hosting model
- `digitalocean-transfer.md`: VPS transfer plan for the Turicum LLC surface while keeping Google Drive as the document source of truth
- `runbook.md`: operator guide for deploys, production checks, rollback, and incident response
- `access-map.md`: system and role map for GitHub, DigitalOcean, Supabase, Google Drive, and user access
- `state-pack-matrix.md`: business and legal requirements by state and structure
- `pipeline-and-schema.md`: pipeline stages, statuses, entity model, and document taxonomy
- `build-plan.md`: implementation order for a lean MVP

## Supporting config

Machine-readable starter state packs live under `config/state-packs/`.

These are not final legal definitions. They are implementation scaffolding that should be reviewed and refined with counsel before production use.
