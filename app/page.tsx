import Link from "next/link";
import { SearchForm } from "@/components/SearchForm";

export default function HomePage() {
  return (
    <main>
      <header className="container-shell flex items-center justify-between py-6"><Link href="/" className="text-xl font-bold tracking-tight text-teal-800">BalkanBus</Link><span className="text-sm text-slate-500">Travel Albania with confidence</span></header>
      <section className="bg-slate-900 py-20 text-white"><div className="container-shell"><p className="mb-4 font-semibold uppercase tracking-[.2em] text-teal-300">Your next Albanian adventure</p><h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Simple bus travel, from coast to mountains.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Compare trusted routes, see clear prices, and book your seat online in minutes.</p><div className="mt-10"><SearchForm /></div></div></section>
      <section className="container-shell grid gap-6 py-14 md:grid-cols-3"><div><h2 className="font-semibold">Reliable schedules</h2><p className="mt-2 text-sm leading-6 text-slate-600">Clear departure times and station details for every route.</p></div><div><h2 className="font-semibold">Transparent prices</h2><p className="mt-2 text-sm leading-6 text-slate-600">Compare options without hidden booking surprises.</p></div><div><h2 className="font-semibold">Digital tickets</h2><p className="mt-2 text-sm leading-6 text-slate-600">Keep your booking confirmation and QR ticket on your phone.</p></div></section>
    </main>
  );
}
