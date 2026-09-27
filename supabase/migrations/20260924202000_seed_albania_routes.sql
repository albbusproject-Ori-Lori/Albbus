-- Phase 1: operator metadata and starter Albanian route catalogue
create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  support_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trips add column if not exists operator_id uuid references public.operators(id) on delete restrict;

create index if not exists trips_operator_id_idx on public.trips (operator_id);

create trigger operators_set_updated_at before update on public.operators
for each row execute function public.set_updated_at();

alter table public.operators enable row level security;
drop policy if exists "Operators are publicly readable" on public.operators;
create policy "Operators are publicly readable" on public.operators
for select using (true);

insert into public.operators (name, slug, support_email) values
  ('Albania Express', 'albania-express', 'support@albaniaexpress.example'),
  ('Eagle Bus', 'eagle-bus', 'support@eaglebus.example'),
  ('Southline', 'southline', 'support@southline.example')
on conflict (slug) do update set name = excluded.name, support_email = excluded.support_email;

insert into public.locations (city_name, station_name, latitude, longitude) values
  ('Tirana', 'Tirana Bus Terminal', 41.327500, 19.818700),
  ('Durrës', 'Durrës Central Bus Station', 41.323600, 19.441400),
  ('Shkodër', 'Shkodër Bus Station', 42.068300, 19.512600),
  ('Vlora', 'Vlora Bus Station', 40.466100, 19.491400),
  ('Sarandë', 'Sarandë Bus Station', 39.875000, 20.005000),
  ('Berat', 'Berat Bus Station', 40.705800, 19.952200),
  ('Gjirokastër', 'Gjirokastër Bus Station', 40.075800, 20.138900),
  ('Korçë', 'Korçë Bus Station', 40.618600, 20.780800)
on conflict (city_name, station_name) do update set latitude = excluded.latitude, longitude = excluded.longitude;

with route_specs (from_city, to_city, operator_slug, departure_hour, duration_minutes, price, seats) as (
  values
    ('Tirana', 'Durrës', 'albania-express', 8, 75, 6.00, 42),
    ('Tirana', 'Durrës', 'eagle-bus', 11, 75, 7.00, 38),
    ('Tirana', 'Berat', 'albania-express', 9, 150, 10.00, 35),
    ('Tirana', 'Shkodër', 'eagle-bus', 7, 120, 9.00, 40),
    ('Tirana', 'Vlora', 'southline', 8, 165, 12.00, 44),
    ('Tirana', 'Sarandë', 'southline', 6, 300, 22.00, 44),
    ('Vlora', 'Sarandë', 'southline', 10, 150, 12.00, 40),
    ('Berat', 'Gjirokastër', 'albania-express', 8, 180, 15.00, 32),
    ('Tirana', 'Korçë', 'eagle-bus', 8, 210, 16.00, 38)
), days as (
  select generate_series(current_date, current_date + 30, interval '1 day')::date as travel_date
)
insert into public.trips (
  departure_location_id, arrival_location_id, departure_time, arrival_time,
  price, currency, available_seats, carrier_name, operator_id
)
select
  from_location.id,
  to_location.id,
  (days.travel_date + make_time(route_specs.departure_hour, 0, 0)) at time zone 'Europe/Tirane',
  (days.travel_date + make_time(route_specs.departure_hour, 0, 0) + make_interval(mins => route_specs.duration_minutes)) at time zone 'Europe/Tirane',
  route_specs.price,
  'EUR',
  route_specs.seats,
  operator.name,
  operator.id
from route_specs
join days on true
join public.locations from_location on from_location.city_name = route_specs.from_city
join public.locations to_location on to_location.city_name = route_specs.to_city
join public.operators operator on operator.slug = route_specs.operator_slug
where not exists (
  select 1 from public.trips existing
  where existing.departure_location_id = from_location.id
    and existing.arrival_location_id = to_location.id
    and existing.operator_id = operator.id
    and existing.departure_time = (days.travel_date + make_time(route_specs.departure_hour, 0, 0)) at time zone 'Europe/Tirane'
);
