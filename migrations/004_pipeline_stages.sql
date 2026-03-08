-- Pipeline stages table (configurable)
create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  weight integer not null default 0,
  sort_order integer not null default 0,
  color text not null default '#a1a1aa',
  created_at timestamptz default now() not null
);

alter table pipeline_stages enable row level security;
create policy "Allow all on pipeline_stages" on pipeline_stages for all using (true) with check (true);

-- Add pipeline stage to contacts
alter table contacts add column if not exists pipeline_stage_id uuid references pipeline_stages(id);

-- Seed default stages
insert into pipeline_stages (label, weight, sort_order, color) values
  ('Possible', 10, 1, '#a1a1aa'),
  ('Possibility', 20, 2, '#71717a'),
  ('Qualifying', 30, 3, '#ca8a04'),
  ('Presenting', 40, 4, '#f59e0b'),
  ('Handling Objections', 50, 5, '#f97316'),
  ('Closing', 70, 6, '#22c55e'),
  ('Re-Closing', 90, 7, '#16a34a'),
  ('New Client', 100, 8, '#15803d'),
  ('Lost', 0, 9, '#ef4444'),
  ('Long Term', 10, 10, '#6366f1'),
  ('No Follow-Up', 0, 11, '#52525b');
