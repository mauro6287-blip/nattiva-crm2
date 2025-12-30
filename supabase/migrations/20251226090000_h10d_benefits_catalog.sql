create table if not exists benefits_catalog (
  id uuid default gen_random_uuid() primary key,
  provider_name text not null,
  product_name text not null,
  price numeric not null,
  original_price numeric,
  stock_limit integer,
  max_per_user integer default 2,
  is_active boolean default true,
  image_url text,
  created_at timestamp with time zone default now()
);

-- RLS: Only admins can manage, but (for now) let's stick to standard practice:
-- Authenticated users (external API) might need SELECT later, but for now only admins manage.
alter table benefits_catalog enable row level security;

create policy "Admins can manage benefits"
  on benefits_catalog for all
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));

-- Allow public read for the API (if bypass RLS is not used) or Auth Read
create policy "Public read access for API"
  on benefits_catalog for select
  using (true);
