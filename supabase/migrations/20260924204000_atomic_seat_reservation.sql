-- Phase 2: concurrency-safe reservation primitive.
-- The UPDATE lock ensures concurrent requests cannot reserve the last seat twice.
create or replace function public.reserve_trip_seat(
  p_trip_id uuid,
  p_passenger_name text,
  p_passenger_email text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  reserved_trip public.trips;
  created_booking public.bookings;
begin
  if p_trip_id is null then
    raise exception using errcode = '22023', message = 'A trip is required.';
  end if;

  if length(trim(coalesce(p_passenger_name, ''))) < 2 then
    raise exception using errcode = '22023', message = 'Passenger name must contain at least 2 characters.';
  end if;

  if position('@' in trim(coalesce(p_passenger_email, ''))) < 2 then
    raise exception using errcode = '22023', message = 'A valid passenger email is required.';
  end if;

  update public.trips
  set available_seats = available_seats - 1
  where id = p_trip_id
    and available_seats > 0
    and departure_time > now()
  returning * into reserved_trip;

  if not found then
    if exists (select 1 from public.trips where id = p_trip_id and departure_time <= now()) then
      raise exception using errcode = 'P0001', message = 'This trip has already departed.';
    end if;
    if exists (select 1 from public.trips where id = p_trip_id and available_seats = 0) then
      raise exception using errcode = 'P0001', message = 'This trip is sold out.';
    end if;
    raise exception using errcode = 'P0001', message = 'Trip not found.';
  end if;

  insert into public.bookings (trip_id, passenger_name, passenger_email, status)
  values (reserved_trip.id, trim(p_passenger_name), lower(trim(p_passenger_email)), 'pending')
  returning * into created_booking;

  return created_booking;
end;
$$;

revoke all on function public.reserve_trip_seat(uuid, text, text) from public;
grant execute on function public.reserve_trip_seat(uuid, text, text) to anon, authenticated;
