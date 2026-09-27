import Link from "next/link";
import { BookingForm } from "@/components/BookingForm";
import { getTrip } from "@/lib/trips";

export const dynamic = "force-dynamic";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Tirane" }).format(new Date(value));
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "EUR" }).format(value);
}

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; trip?: string }> }) {
  const params = await searchParams;
  const result = await getTrip(params.trip || "");
  const trip = result.trip;
  const from = trip?.departure_location.city_name || params.from || "Origin";
  const to = trip?.arrival_location.city_name || params.to || "Destination";

  return <main className="min-h-screen"><header className="border-b border-slate-200 bg-white"><div className="container-shell py-5"><Link href="/" className="font-bold text-teal-800">BalkanBus</Link></div></header><section className="container-shell grid gap-8 py-10 lg:grid-cols-[1fr_360px]"><div><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Step 1 of 2</p><h1 className="mt-2 text-3xl font-bold">Passenger details</h1><p className="mt-2 text-slate-600">{from} → {to}</p>{!result.configured && <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Connect Supabase and apply the migrations before making reservations.</div>}{result.configured && !trip && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">This trip could not be found. <Link href="/" className="font-semibold underline">Return to search</Link>.</div>}{trip && <BookingForm tripId={trip.id} />}</div>{trip && <aside className="h-fit rounded-2xl bg-slate-900 p-6 text-white"><p className="text-sm text-slate-400">Your journey</p><h2 className="mt-2 text-xl font-semibold">{from} → {to}</h2><p className="mt-2 text-sm text-slate-300">{formatTime(trip.departure_time)} – {trip.arrival_time ? formatTime(trip.arrival_time) : "—"}</p><p className="mt-1 text-sm text-slate-400">{trip.operator?.name || trip.carrier_name || "Local operator"}</p><div className="my-6 border-t border-slate-700" /><div className="flex justify-between"><span className="text-slate-300">Bus ticket</span><span>{formatPrice(Number(trip.price), trip.currency)}</span></div><div className="mt-4 flex justify-between border-t border-slate-700 pt-4 font-bold"><span>Total</span><span>{formatPrice(Number(trip.price), trip.currency)}</span></div></aside>}</section></main>;
}
