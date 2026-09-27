import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = createSupabaseAdminClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !supabase || !webhookSecret || !signature) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Invalid webhook signature.";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (event.type === "checkout.session.completed" && session.payment_status !== "paid") return NextResponse.json({ received: true });
      const bookingId = session.metadata?.booking_id || session.client_reference_id;
      if (!bookingId) return NextResponse.json({ error: "Missing booking metadata." }, { status: 400 });
      const { error } = await supabase.rpc("confirm_booking_payment", {
        p_booking_id: bookingId,
        p_checkout_session_id: session.id,
        p_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      });
      if (error) throw error;
    }

    if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id || session.client_reference_id;
      if (bookingId) {
        const { error } = await supabase.rpc("cancel_pending_booking", { p_booking_id: bookingId });
        if (error) throw error;
      }
    }

    const { error: eventError } = await supabase.from("stripe_webhook_events").insert({ id: event.id, event_type: event.type });
    if (eventError && eventError.code !== "23505") throw eventError;
    return NextResponse.json({ received: true });
  } catch (caught) {
    console.error("Stripe webhook fulfillment failed", caught);
    return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
  }
}
