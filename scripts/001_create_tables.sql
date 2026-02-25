-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text default 'circle',
  color text default '#6B7280',
  budget_amount integer default 0,
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;
create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

-- Payment methods table
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('credit', 'debit', 'cash', 'bank')),
  color text default '#3B82F6',
  monthly_target integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.payment_methods enable row level security;
create policy "payment_methods_select_own" on public.payment_methods for select using (auth.uid() = user_id);
create policy "payment_methods_insert_own" on public.payment_methods for insert with check (auth.uid() = user_id);
create policy "payment_methods_update_own" on public.payment_methods for update using (auth.uid() = user_id);
create policy "payment_methods_delete_own" on public.payment_methods for delete using (auth.uid() = user_id);

-- Transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount integer not null,
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  description text,
  memo text,
  date date not null,
  is_fixed boolean default false,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

-- Fixed expenses table (recurring)
create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  description text not null,
  amount integer not null,
  day_of_month integer not null check (day_of_month >= 1 and day_of_month <= 31),
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.fixed_expenses enable row level security;
create policy "fixed_expenses_select_own" on public.fixed_expenses for select using (auth.uid() = user_id);
create policy "fixed_expenses_insert_own" on public.fixed_expenses for insert with check (auth.uid() = user_id);
create policy "fixed_expenses_update_own" on public.fixed_expenses for update using (auth.uid() = user_id);
create policy "fixed_expenses_delete_own" on public.fixed_expenses for delete using (auth.uid() = user_id);
