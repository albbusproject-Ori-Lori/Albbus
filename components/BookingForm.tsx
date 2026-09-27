"use client";

import { FormEvent, useState } from "react";
import type { Booking } from "@/types/booking";

export function BookingForm({ tripId }: { tripId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const passengerName = String(form.get("passenger_name") || "");
    const passengerEmail = String(form.get("passenger_email") || "");
    try {
      const reserveResponse = await fetch("/api/bookings/reserve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, passengerName, passengerEmail }) });
      const reserved = await reserveResponse.json() as { booking?: Booking; error?: string };
      if (!reserveResponse.ok || !reserved.booking) throw new Error(reserved.error || "Could not reserve this seat.");

      const checkoutResponse = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId: reserved.booking.id, passengerEmail }) });
      const checkout = await checkoutResponse.json() as { url?: string; error?: string };
      if (!checkoutResponse.ok || !checkout.url) throw new Error(checkout.error || "Could not start secure payment.");
      window.location.assign(checkout.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start secure payment.");
      setSubmitting(false);
    }
  }

  return <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6"><label className="block text-sm font-medium">Full name<input name="passenger_name" required minLength={2} className="field mt-2" placeholder="Alex Morgan" /></label><label className="block text-sm font-medium">Email address<input name="passenger_email" type="email" required className="field mt-2" placeholder="alex@example.com" /></label>{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}<button type="submit" disabled={submitting} className="primary-button w-full disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Opening secure payment…" : "Continue to secure payment"}</button><p className="text-center text-xs text-slate-500">You will complete payment securely on Stripe.</p></form>;
}
