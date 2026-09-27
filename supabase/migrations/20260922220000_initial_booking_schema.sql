-- Albania Bus Booking System: initial Supabase schema
create extension if not exists "pgcrypto";

create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'expired');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  city_name text not null check (length(trim(city_name)) > 0),
  station_name text not null check (length(trim(station_name)) > 0),
  latitude numeric(9,6) check (latitude between -90 and 90),
  longitude numeric(9,6) check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_name, station_name)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  departure_location_id uuid not null references public.locations(id) on delete restrict,
  arrival_location_id uuid not null references public.locations(id) on delete restrict,
  departure_time timestamptz not null,
  arrival_time timestamptz,
  price numeric(10,2) not null check (price >= 0),
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  available_seats integer not null check (available_seats >= 0),
  carrier_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (departure_location_id <> arrival_location_id),
  check (arrival_time is null or arrival_time > departure_time)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete restrict,
  passenger_name text not null check (length(trim(passenger_name)) >= 2),
  passenger_email text not null check (position('@' in passenger_email) > 1),
  qr_code text unique,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_route_time_idx on public.trips (departure_location_id, arrival_location_id, departure_time);
create index trips_departure_time_idx on public.trips (departure_time);
create index bookings_trip_id_idx on public.bookings (trip_id);
create index bookings_email_idx on public.bookings (lower(passenger_email));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger locations_set_updated_at before update on public.locations
for each row execute function public.set_updated_at();
create trigger trips_set_updated_at before update on public.trips
for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

alter table public.locations enable row level security;
alter table public.trips enable row level security;
alter table public.bookings enable row level security;

create policy "Locations are publicly readable" on public.locations
for select using (true);
create policy "Trips are publicly readable" on public.trips
for select using (true);

-- Booking inserts should be performed through a server-side route or RPC after
-- payment/availability validation; no anonymous direct insert policy is added.
