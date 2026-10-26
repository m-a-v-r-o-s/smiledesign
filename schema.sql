-- Smile Design patient forms, Supabase Postgres (EU). Only the server touches it, as the smiledesign_app role.
-- RLS is on and only smiledesign_app has a policy: the Supabase API (anon/authenticated keys) sees nothing.
-- After applying, give the role a password once (never commit it): alter role smiledesign_app password '...';

create table patients (
  id uuid primary key,
  first_name text not null,
  last_name text not null,
  dob date not null,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key,
  ref text not null unique,
  patient_id uuid not null references patients (id),
  form_id text not null,
  lang text not null,
  answers text not null,   -- AES-256-GCM with the server's DATA_KEY
  signature text not null, -- same
  submitted_at timestamptz not null,
  reviewed_at timestamptz
);
create index on submissions (patient_id);

create table settings (
  key text primary key,
  value jsonb not null
);

revoke all on patients, submissions, settings from anon, authenticated;
alter table patients enable row level security;
alter table submissions enable row level security;
alter table settings enable row level security;

-- App role: read, insert, update. No delete, no DDL.
create role smiledesign_app login;
grant usage on schema public to smiledesign_app;
grant select, insert, update on patients, submissions to smiledesign_app;
grant select, insert on settings to smiledesign_app;
create policy app on patients to smiledesign_app using (true) with check (true);
create policy app on submissions to smiledesign_app using (true) with check (true);
create policy app on settings to smiledesign_app using (true) with check (true);
