"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";

const locations = ["Tirana", "Durrës", "Shkodër", "Vlora", "Sarandë", "Berat", "Gjirokastër"];

export function SearchForm() {
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const from = String(data.get("from") || "");
    const to = String(data.get("to") || "");
    const date = String(data.get("date") || "");
    router.push(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl bg-white p-4 shadow-xl shadow-slate-900/10 md:grid-cols-[1fr_1fr_170px_auto]">
      <label className="text-sm font-medium text-slate-600">From<select name="from" required className="field mt-1"><option value="">Choose city</option>{locations.map((city) => <option key={city}>{city}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-600">To<select name="to" required className="field mt-1"><option value="">Choose city</option>{locations.map((city) => <option key={city}>{city}</option>)}</select></label>
      <label className="text-sm font-medium text-slate-600">Travel date<input name="date" type="date" required className="field mt-1" /></label>
      <button className="primary-button self-end" type="submit">Search buses</button>
    </form>
  );
}
