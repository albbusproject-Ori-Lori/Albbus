import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type BookingWithTrip = {
  id: string;
  trip_id: string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  passenger_email: string;
  trip: { price: number; currency: string; departure_time: string; carrier_name: string | null } | null;
};

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = createSupabaseAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!stripe || !supabase || !appUrl) {
    return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });
  }

  let body: { bookingId?: unknown; passengerEmail?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  const passengerEmail = typeof body.passengerEmail === "string" ? body.passengerEmail.trim().toLowerCase() : "";
  if (!bookingId || !/^\S+@\S+\.\S+$/.test(passengerEmail)) {
    return NextResponse.json({ error: "A valid booking and passenger email are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, trip_id, status, passenger_email, trip:trips(price, currency, departure_time, carrier_name)")
    .eq("id", bookingId)
    .eq("passenger_email", passengerEmail)
    .maybeSingle();
  const booking = data as BookingWithTrip | null;

  if (error || !booking || !booking.trip) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "pending") return NextResponse.json({ error: "This booking is no longer payable." }, { status: 409 });
  if (new Date(booking.trip.departure_time) <= new Date()) return NextResponse.json({ error: "This trip has already departed." }, { status: 409 });

  try {
    const currency = booking.trip.currency.toLowerCase();
    const amount = Math.round(Number(booking.trip.price) * 100);
    if (!Number.isInteger(amount) || amount < 50) return NextResponse.json({ error: "Invalid ticket amount." }, { status: 500 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: booking.id,
      customer_email: passengerEmail,
      line_items: [{
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: { name: "BalkanBus ticket" },
        },
      }],
      metadata: { booking_id: booking.id },
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking?trip=${booking.trip_id}&payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    await supabase.from("bookings").update({ stripe_checkout_session_id: session.id }).eq("id", booking.id).eq("status", "pending");
    return NextResponse.json({ url: session.url });
  } catch (caught) {
    await supabase.rpc("cancel_pending_booking", { p_booking_id: booking.id });
    const message = caught instanceof Error ? caught.message : "Could not create Stripe Checkout Session.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
