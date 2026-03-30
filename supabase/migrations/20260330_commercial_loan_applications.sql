create table if not exists commercial_loan_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'submitted',
  primary_borrower_name text not null,
  primary_borrower_email text not null,
  primary_borrower_phone text,
  co_borrower_name text,
  co_borrower_email text,
  annual_income numeric(14, 2),
  requested_amount numeric(14, 2),
  property_address text not null,
  property_type text not null,
  borrowing_entity_name text not null,
  profile jsonb not null default '{}'::jsonb,
  financials jsonb not null default '{}'::jsonb,
  subject_property jsonb not null default '{}'::jsonb,
  declarations jsonb not null default '{}'::jsonb
);

create index if not exists idx_commercial_loan_applications_created_at
  on commercial_loan_applications (created_at desc);

create index if not exists idx_commercial_loan_applications_email
  on commercial_loan_applications (lower(primary_borrower_email));
