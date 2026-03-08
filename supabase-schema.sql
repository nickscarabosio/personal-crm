-- Personal CRM Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Companies table
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  industry text,
  size text,
  website text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tags table
create table tags (
  id uuid primary key default uuid_generate_v4(),
  label text not null unique,
  color text not null default '#6B7280',
  created_at timestamptz default now()
);

-- Contacts table
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  first_name text not null,
  last_name text,
  email text,
  phone text,
  company_id uuid references companies(id) on delete set null,
  company_name text,
  role text,
  linkedin_url text,
  source text,
  status text not null default 'active' check (status in ('lead', 'active', 'dormant', 'closed')),
  notes text,
  last_contacted_at timestamptz,
  follow_up_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contact Tags junction table
create table contact_tags (
  contact_id uuid references contacts(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- Interactions table
create table interactions (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references contacts(id) on delete cascade not null,
  type text not null check (type in ('call', 'email', 'meeting', 'dm', 'note', 'linkedin', 'other')),
  date timestamptz not null default now(),
  summary text,
  outcome text,
  follow_up_date date,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_contacts_status on contacts(status);
create index idx_contacts_follow_up on contacts(follow_up_date);
create index idx_contacts_last_contacted on contacts(last_contacted_at);
create index idx_contacts_company on contacts(company_id);
create index idx_interactions_contact on interactions(contact_id);
create index idx_interactions_date on interactions(date);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at
  before update on contacts
  for each row execute function update_updated_at();

create trigger companies_updated_at
  before update on companies
  for each row execute function update_updated_at();

-- Function to auto-update last_contacted_at when an interaction is logged
create or replace function update_last_contacted()
returns trigger as $$
begin
  update contacts
  set last_contacted_at = new.date
  where id = new.contact_id
    and (last_contacted_at is null or last_contacted_at < new.date);

  -- If interaction has a follow_up_date, update the contact too
  if new.follow_up_date is not null then
    update contacts
    set follow_up_date = new.follow_up_date
    where id = new.contact_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger interactions_update_contact
  after insert on interactions
  for each row execute function update_last_contacted();

-- Row Level Security (enable but allow all for single user with anon key)
alter table contacts enable row level security;
alter table companies enable row level security;
alter table tags enable row level security;
alter table contact_tags enable row level security;
alter table interactions enable row level security;

-- Policies: allow all operations for authenticated and anon users (single user app)
-- You can tighten these later with Supabase Auth
create policy "Allow all on contacts" on contacts for all using (true) with check (true);
create policy "Allow all on companies" on companies for all using (true) with check (true);
create policy "Allow all on tags" on tags for all using (true) with check (true);
create policy "Allow all on contact_tags" on contact_tags for all using (true) with check (true);
create policy "Allow all on interactions" on interactions for all using (true) with check (true);

-- Seed data: 10 test contacts
insert into companies (id, name, industry, website) values
  ('a1000000-0000-0000-0000-000000000001', 'Acme Corp', 'Technology', 'https://acme.com'),
  ('a1000000-0000-0000-0000-000000000002', 'Globex Inc', 'Finance', 'https://globex.com'),
  ('a1000000-0000-0000-0000-000000000003', 'Initech', 'Consulting', 'https://initech.com'),
  ('a1000000-0000-0000-0000-000000000004', 'Umbrella Co', 'Healthcare', 'https://umbrella.co'),
  ('a1000000-0000-0000-0000-000000000005', 'Stark Industries', 'Manufacturing', 'https://stark.io');

insert into tags (id, label, color) values
  ('b1000000-0000-0000-0000-000000000001', 'VIP', '#EF4444'),
  ('b1000000-0000-0000-0000-000000000002', 'Prospect', '#F59E0B'),
  ('b1000000-0000-0000-0000-000000000003', 'Partner', '#10B981'),
  ('b1000000-0000-0000-0000-000000000004', 'Investor', '#6366F1'),
  ('b1000000-0000-0000-0000-000000000005', 'Friend', '#EC4899');

insert into contacts (id, first_name, last_name, email, phone, company_id, company_name, role, linkedin_url, source, status, last_contacted_at, follow_up_date) values
  ('c1000000-0000-0000-0000-000000000001', 'Sarah', 'Chen', 'sarah@acme.com', '555-0101', 'a1000000-0000-0000-0000-000000000001', 'Acme Corp', 'VP Engineering', 'https://linkedin.com/in/sarachen', 'Conference', 'active', now() - interval '2 days', current_date + interval '3 days'),
  ('c1000000-0000-0000-0000-000000000002', 'Mike', 'Johnson', 'mike@globex.com', '555-0102', 'a1000000-0000-0000-0000-000000000002', 'Globex Inc', 'CFO', 'https://linkedin.com/in/mikejohnson', 'Referral', 'active', now() - interval '5 days', current_date + interval '1 day'),
  ('c1000000-0000-0000-0000-000000000003', 'Lisa', 'Park', 'lisa@initech.com', '555-0103', 'a1000000-0000-0000-0000-000000000003', 'Initech', 'Director of Strategy', 'https://linkedin.com/in/lisapark', 'LinkedIn', 'lead', now() - interval '14 days', current_date - interval '2 days'),
  ('c1000000-0000-0000-0000-000000000004', 'James', 'Wright', 'james@umbrella.co', '555-0104', 'a1000000-0000-0000-0000-000000000004', 'Umbrella Co', 'CEO', null, 'Cold Outreach', 'lead', now() - interval '30 days', null),
  ('c1000000-0000-0000-0000-000000000005', 'Ana', 'Rivera', 'ana@stark.io', '555-0105', 'a1000000-0000-0000-0000-000000000005', 'Stark Industries', 'Head of BD', 'https://linkedin.com/in/anarivera', 'Conference', 'active', now() - interval '1 day', current_date + interval '7 days'),
  ('c1000000-0000-0000-0000-000000000006', 'Tom', 'Baker', 'tom.baker@gmail.com', '555-0106', null, null, 'Freelance Designer', 'https://linkedin.com/in/tombaker', 'Twitter', 'active', now() - interval '7 days', current_date),
  ('c1000000-0000-0000-0000-000000000007', 'Rachel', 'Kim', 'rachel@acme.com', '555-0107', 'a1000000-0000-0000-0000-000000000001', 'Acme Corp', 'Product Manager', null, 'Referral', 'dormant', now() - interval '60 days', null),
  ('c1000000-0000-0000-0000-000000000008', 'David', 'Okafor', 'david.okafor@outlook.com', '555-0108', null, null, 'Angel Investor', 'https://linkedin.com/in/davidokafor', 'Intro', 'active', now() - interval '3 days', current_date + interval '5 days'),
  ('c1000000-0000-0000-0000-000000000009', 'Emma', 'Torres', 'emma@globex.com', '555-0109', 'a1000000-0000-0000-0000-000000000002', 'Globex Inc', 'VP Sales', 'https://linkedin.com/in/emmatorres', 'Conference', 'closed', now() - interval '90 days', null),
  ('c1000000-0000-0000-0000-000000000010', 'Chris', 'Nguyen', 'chris.nguyen@gmail.com', '555-0110', null, null, 'Startup Founder', 'https://linkedin.com/in/chrisnguyen', 'Mutual Friend', 'active', now() - interval '10 days', current_date - interval '5 days');

-- Seed contact tags
insert into contact_tags (contact_id, tag_id) values
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000005'),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000005');

-- Seed interactions
insert into interactions (contact_id, type, date, summary, outcome) values
  ('c1000000-0000-0000-0000-000000000001', 'meeting', now() - interval '2 days', 'Discussed partnership opportunity for Q2', 'Positive - sending proposal'),
  ('c1000000-0000-0000-0000-000000000001', 'email', now() - interval '10 days', 'Initial intro email after SaaStr', 'Replied same day'),
  ('c1000000-0000-0000-0000-000000000002', 'call', now() - interval '5 days', 'Quarterly check-in call', 'Interested in new product line'),
  ('c1000000-0000-0000-0000-000000000003', 'dm', now() - interval '14 days', 'LinkedIn DM about consulting engagement', 'No response yet'),
  ('c1000000-0000-0000-0000-000000000005', 'meeting', now() - interval '1 day', 'Coffee meeting downtown', 'Great conversation, wants to collaborate'),
  ('c1000000-0000-0000-0000-000000000006', 'email', now() - interval '7 days', 'Sent project brief for design work', 'Reviewing proposal'),
  ('c1000000-0000-0000-0000-000000000008', 'call', now() - interval '3 days', 'Pitch call for seed round', 'Wants to see traction metrics'),
  ('c1000000-0000-0000-0000-000000000010', 'note', now() - interval '10 days', 'Met at founders dinner - great energy, building in AI space', null);
