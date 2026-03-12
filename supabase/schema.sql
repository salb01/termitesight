create extension if not exists "pgcrypto";

create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  latitude double precision,
  longitude double precision,
  client_name text,
  inspection_date date default now(),
  inspector_name text,
  status text default 'draft'
);

create table if not exists structures (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  name text not null,
  type text not null,
  geometry_geojson jsonb not null
);

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  structure_id uuid not null references structures(id) on delete cascade,
  category text not null,
  subtype text,
  severity text,
  area text,
  recommendation text,
  latitude double precision,
  longitude double precision,
  notes text
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  finding_id uuid not null references findings(id) on delete cascade,
  file_url text not null,
  caption text,
  timestamp timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  pdf_url text,
  generated_at timestamptz default now()
);
