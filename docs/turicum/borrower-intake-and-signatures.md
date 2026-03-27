# Borrower Intake and Signature Design

## Goal

Turicum should handle two distinct layers:

1. `Borrower intake`
   Collect information directly from the borrower or guarantor in a controlled portal.
2. `Formal signature routing`
   Send signature-bearing documents through a dedicated provider after Turicum reviews the intake.

## Current Forms Built In

- `Commercial loan application`
- `Guarantor authorization to release information`
- `Lender fee agreement intake`

## Current Product Flow

1. Open a case.
2. Go to `/cases/[id]/intake`.
3. Assign borrower-facing forms and borrower contact info.
4. Share the generated `/borrower/[token]` link.
5. Borrower completes the packet in Turicum.
6. Ops reviews the packet.
7. Ops creates signature requests for documents that require formal execution.

## Why Signature Is Separate

The borrower may complete form fields in Turicum, but a legal signature flow should still be routed through a signature provider for:

- signer identity handling
- audit trail
- executed PDF capture
- status tracking outside of manual email

## Recommended First Provider

- `Google Workspace eSignature` if the team already works in Google Docs / Drive

## Current Limitation

Turicum currently tracks signature requests and provider choice, but it does not yet call an external signature API.

## Prepared Migration

A starter migration for Supabase-backed borrower portals and signature requests is available at `/supabase/migrations/20260315_borrower_portals.sql`.
