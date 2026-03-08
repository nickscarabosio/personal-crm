-- Add goal fields to contacts
alter table contacts add column if not exists goal text;
alter table contacts add column if not exists goal_target_date date;

-- Create milestones table
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade not null,
  title text not null,
  target_date date,
  completed boolean default false not null,
  completed_at timestamptz,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

-- RLS
alter table milestones enable row level security;
create policy "Allow all on milestones" on milestones for all using (true) with check (true);

-- Index for fast lookup
create index if not exists idx_milestones_contact_id on milestones(contact_id);
