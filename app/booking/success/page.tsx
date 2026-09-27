import Link from "next/link";

export default function BookingSuccessPage() {
  return <main className="min-h-screen"><header className="border-b border-slate-200 bg-white"><div className="container-shell py-5"><Link href="/" className="font-bold text-teal-800">BalkanBus</Link></div></header><section className="container-shell py-20"><div className="mx-auto max-w-xl rounded-2xl border border-teal-200 bg-teal-50 p-8 text-center"><p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Payment received</p><h1 className="mt-3 text-3xl font-bold text-teal-950">Your ticket is being confirmed</h1><p className="mt-4 leading-7 text-teal-900">Stripe has returned you to BalkanBus. Your secure webhook will confirm the booking and issue the ticket shortly.</p><Link href="/" className="primary-button mt-8">Back to search</Link></div></section></main>;
}
