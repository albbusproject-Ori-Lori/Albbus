-- Phase 3: Stripe payment state and idempotent fulfillment.
alter table public.bookings
  add column if not exists stripe_checkout_session_id text unique,
  add column if not exists stripe_payment_intent_id text unique,
  add column if not exists paid_at timestamptz;

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

create or replace function public.confirm_booking_payment(
  p_booking_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_booking public.bookings;
begin
  update public.bookings
  set status = 'confirmed',
      stripe_checkout_session_id = coalesce(p_checkout_session_id, stripe_checkout_session_id),
      stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
      paid_at = coalesce(paid_at, now())
  where id = p_booking_id
    and status in ('pending', 'confirmed')
  returning * into updated_booking;

  if not found then
    raise exception using errcode = 'P0001', message = 'Booking not found or cannot be confirmed.';
  end if;

  return updated_booking;
end;
$$;

create or replace function public.cancel_pending_booking(p_booking_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cancelled_booking public.bookings;
begin
  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id
    and status = 'pending'
  returning * into cancelled_booking;

  if not found then
    return false;
  end if;

  update public.trips
  set available_seats = available_seats + 1
  where id = cancelled_booking.trip_id;

  return true;
end;
$$;

revoke all on function public.confirm_booking_payment(uuid, text, text) from public;
revoke all on function public.cancel_pending_booking(uuid) from public;
grant execute on function public.confirm_booking_payment(uuid, text, text) to service_role;
grant execute on function public.cancel_pending_booking(uuid) to service_role;
