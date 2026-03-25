# Supabase Setup

## What To Run In Supabase

1. Create a new Supabase project.
2. Open the SQL Editor.
3. Run [schema.sql](/Users/marcohilty/Documents/HVAC%20automation/Lending%20Platform/supabase/schema.sql).
4. Run [seed.sql](/Users/marcohilty/Documents/HVAC%20automation/Lending%20Platform/supabase/seed.sql).

## Local Env

Create `.env.local` in the project root with:

```bash
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Once those values exist, Atlas will automatically switch from local JSON fallback mode to Supabase mode.
