import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Booking service is not configured." }, { status: 503 });
  }

  let body: { tripId?: unknown; passengerName?: unknown; passengerEmail?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const tripId = typeof body.tripId === "string" ? body.tripId : "";
  const passengerName = typeof body.passengerName === "string" ? body.passengerName.trim() : "";
  const passengerEmail = typeof body.passengerEmail === "string" ? body.passengerEmail.trim() : "";
  if (!tripId || passengerName.length < 2 || !/^\S+@\S+\.\S+$/.test(passengerEmail)) {
    return NextResponse.json({ error: "Enter a valid passenger name and email." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("reserve_trip_seat", {
    p_trip_id: tripId,
    p_passenger_name: passengerName,
    p_passenger_email: passengerEmail,
  });

  if (error) {
    const status = error.code === "P0001" ? 409 : error.code === "22023" ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ booking: data }, { status: 201 });
}
