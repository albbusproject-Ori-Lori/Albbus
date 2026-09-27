-- BalkanBus admin operations: indexes and read policies.
-- Data writes remain server-only through the admin API.

create index if not exists operators_name_idx on public.operators (name);
create index if not exists locations_city_name_idx on public.locations (city_name);
create index if not exists trips_operator_departure_idx on public.trips (operator_id, departure_time);

alter table public.operators enable row level security;
alter table public.locations enable row level security;
alter table public.trips enable row level security;

drop policy if exists operators_public_read on public.operators;
create policy operators_public_read on public.operators for select using (true);
drop policy if exists locations_public_read on public.locations;
create policy locations_public_read on public.locations for select using (true);
drop policy if exists trips_public_read on public.trips;
create policy trips_public_read on public.trips for select using (true);
