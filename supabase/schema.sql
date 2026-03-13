-- Enable extension for UUID generation
create extension if not exists pgcrypto;

-- Main table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  date date not null,
  time time not null,
  payment_status text not null check (payment_status in ('pending', 'paid', 'expired', 'failed')),
  mercadopago_preference_id text,
  mercadopago_payment_id text,
  google_event_id text,
  whatsapp_sent boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

comment on table public.bookings is 'Booking lifecycle for consultations with payments and confirmations';

-- Useful indexes
create index if not exists idx_bookings_date_time on public.bookings (date, time);
create index if not exists idx_bookings_status on public.bookings (payment_status);
create index if not exists idx_bookings_expires_at on public.bookings (expires_at);
create index if not exists idx_bookings_mp_pref on public.bookings (mercadopago_preference_id);
create index if not exists idx_bookings_mp_payment on public.bookings (mercadopago_payment_id);

-- Prevent duplicates for active bookings:
-- only one row can keep a slot while pending/paid. Expired/failed rows release it.
create unique index if not exists uq_bookings_active_slot
  on public.bookings (date, time)
  where payment_status in ('pending', 'paid');

-- Automatically expire stale pending rows (15 min lock window)
create or replace function public.expire_pending_bookings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer := 0;
begin
  update public.bookings
  set payment_status = 'expired'
  where payment_status = 'pending'
    and expires_at is not null
    and expires_at <= now();

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- Atomic lock function for concurrency control during checkout creation.
create or replace function public.create_pending_booking(
  p_name text,
  p_email text,
  p_phone text,
  p_date date,
  p_time time,
  p_mercadopago_preference_id text,
  p_expires_at timestamptz default (now() + interval '15 minutes')
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
  v_slot_key text;
begin
  -- Expire old pending rows first, so released slots become available.
  perform public.expire_pending_bookings();

  -- Transaction-level advisory lock by slot; avoids race conditions.
  v_slot_key := to_char(p_date, 'YYYY-MM-DD') || '|' || p_time::text;
  perform pg_advisory_xact_lock(hashtext(v_slot_key));

  insert into public.bookings (
    name,
    email,
    phone,
    date,
    time,
    payment_status,
    mercadopago_preference_id,
    expires_at
  )
  values (
    p_name,
    p_email,
    p_phone,
    p_date,
    p_time,
    'pending',
    p_mercadopago_preference_id,
    p_expires_at
  )
  returning * into v_booking;

  return v_booking;
exception
  when unique_violation then
    raise exception 'SLOT_ALREADY_TAKEN'
      using errcode = 'P0001',
            hint = 'The selected slot is no longer available.';
end;
$$;

-- RLS (disabled for server-side service role usage by default).
alter table public.bookings enable row level security;

-- Minimal policy example for authenticated reads (adjust as needed).
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'Allow read for authenticated users'
  ) then
    create policy "Allow read for authenticated users"
    on public.bookings
    for select
    to authenticated
    using (true);
  end if;
end
$$;
