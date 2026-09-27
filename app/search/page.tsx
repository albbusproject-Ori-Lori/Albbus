import Link from "next/link";
import { searchTrips } from "@/lib/trips";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string; to?: string; date?: string }>;

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Tirane" }).format(new Date(value));
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "EUR" }).format(value);
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const from = params.from || "";
  const to = params.to || "";
  const date = params.date || "";
  const result = from && to && date
    ? await searchTrips(from, to, date)
    : { trips: [], configured: true, error: "Choose an origin, destination, and travel date to search." };

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white"><div className="container-shell flex items-center justify-between py-5"><Link href="/" className="font-bold text-teal-800">BalkanBus</Link><Link href="/" className="text-sm text-slate-600 hover:text-teal-700">Change search</Link></div></header>
      <section className="container-shell py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Available journeys</p>
        <h1 className="mt-2 text-3xl font-bold">{from || "Choose origin"} <span className="text-slate-400">→</span> {to || "Choose destination"}</h1>
        <p className="mt-2 text-slate-600">{date || "No date selected"} · {result.trips.length} options</p>
        {!result.configured && <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><p className="font-semibold">Supabase is not connected yet.</p><p className="mt-1 text-sm">Add the Vercel environment variables, apply all migrations, redeploy, then check <code>/api/health</code>.</p></div>}
        {result.error && result.configured && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800"><p className="font-semibold">We could not load journeys.</p><p className="mt-1 text-sm">{result.error}</p></div>}
        {!result.error && result.configured && result.trips.length === 0 && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="font-semibold">No buses found for this date.</p><p className="mt-2 text-sm text-slate-500">Try another date or search a different route.</p></div>}
        <div className="mt-8 space-y-4">{result.trips.map((trip) => <article key={trip.id} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-8"><div><p className="text-2xl font-bold">{formatTime(trip.departure_time)}</p><p className="text-sm text-slate-500">{trip.departure_location.station_name}</p></div><div className="pt-1 text-slate-400">→</div><div><p className="text-2xl font-bold">{trip.arrival_time ? formatTime(trip.arrival_time) : "—"}</p><p className="text-sm text-slate-500">{trip.arrival_location.station_name}</p></div></div><div className="flex items-center justify-between gap-8 sm:justify-end"><div><p className="font-semibold">{formatPrice(Number(trip.price), trip.currency)}</p><p className="text-sm text-slate-500">{trip.operator?.name || trip.carrier_name || "Local operator"} · {trip.available_seats} seats</p></div><Link className="primary-button" href={`/booking?trip=${trip.id}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}>Select</Link></div></article>)}</div>
      </section>
    </main>
  );
}
