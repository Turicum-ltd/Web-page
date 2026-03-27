# Supabase Import

After `schema.sql` and `seed.sql` are loaded into Supabase, you can import the local Turicum working data into the live database.

This includes:

- cases
- case checklist items
- case document metadata
- precedent library entries

Run:

```bash
node scripts/import-supabase-data.mjs
```

The script reads:

- `data/cases.json`
- `data/case-checklist-items.json`
- `data/case-documents.json`
- `data/precedents.json`

and syncs them into Supabase using the credentials in `.env.local`.
