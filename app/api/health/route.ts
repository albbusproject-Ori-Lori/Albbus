import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, supabase: "missing-environment", message: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel." }, { status: 503 });
  }

  const { count, error } = await supabase.from("trips").select("id", { count: "exact", head: true });
  if (error) {
    return NextResponse.json({ ok: false, supabase: "connection-reached-but-query-failed", message: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, supabase: "connected", trips: count ?? 0, message: count ? "Supabase and trips table are ready." : "Supabase is connected, but trips is empty. Apply the seed migration." });
}
