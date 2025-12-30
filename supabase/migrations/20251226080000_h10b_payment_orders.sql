create table if not exists payment_orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id) on delete set null,
  order_code text unique not null,
  amount_expected numeric not null,
  status text check (status in ('PENDING', 'PAID', 'REJECTED')) default 'PENDING',
  created_at timestamp with time zone default now(),
  raw_proof text
);

-- RLS
alter table payment_orders enable row level security;

create policy "Users can view their own orders"
  on payment_orders for select
  using (auth.uid() = user_id);

create policy "Admins can view all orders"
  on payment_orders for select
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));

create policy "Admins can insert orders"
  on payment_orders for insert
  with check (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));
  
create policy "Admins can update orders"
  on payment_orders for update
  using (exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  ));
