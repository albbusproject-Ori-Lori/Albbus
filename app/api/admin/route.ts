import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Resource = "operators" | "locations" | "trips" | "bookings";

function authorized(request: NextRequest) { const expected = process.env.ADMIN_ACCESS_KEY; return Boolean(expected && request.headers.get("x-admin-key") === expected); }
function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
function client() { return createSupabaseAdminClient(); }

export async function GET(request: NextRequest) {
  if (!authorized(request)) return fail("Admin access denied.", 401);
  const supabase = client(); if (!supabase) return fail("SUPABASE_SERVICE_ROLE_KEY is not configured.", 503);
  const resource = (request.nextUrl.searchParams.get("resource") || "trips") as Resource;
  if (resource === "trips") {
    const { data, error } = await supabase.from("trips").select("*, departure_location:locations!departure_location_id(id,city_name,station_name), arrival_location:locations!arrival_location_id(id,city_name,station_name), operator:operators(id,name)").order("departure_time", { ascending: true }).limit(500);
    if (error) return fail(error.message, 500); return NextResponse.json({ data: data ?? [] });
  }
  if (resource === "bookings") {
    const { data, error } = await supabase.from("bookings").select("*, trip:trips(id,departure_time,price,currency,departure_location:locations!departure_location_id(city_name),arrival_location:locations!arrival_location_id(city_name))").order("created_at", { ascending: false }).limit(500);
    if (error) return fail(error.message, 500); return NextResponse.json({ data: data ?? [] });
  }
  if (!["operators", "locations"].includes(resource)) return fail("Unknown resource.");
  const { data, error } = await supabase.from(resource).select("*").order(resource === "locations" ? "city_name" : "name").limit(500);
  if (error) return fail(error.message, 500); return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return fail("Admin access denied.", 401);
  const supabase = client(); if (!supabase) return fail("SUPABASE_SERVICE_ROLE_KEY is not configured.", 503);
  const body = await request.json() as Record<string, unknown>; const resource = body.resource as Resource;
  let payload: Record<string, unknown>;
  if (resource === "operators") payload = { name: String(body.name || "").trim(), slug: String(body.slug || "").trim().toLowerCase(), support_email: String(body.support_email || "").trim() || null };
  else if (resource === "locations") payload = { city_name: String(body.city_name || "").trim(), station_name: String(body.station_name || "").trim(), latitude: body.latitude ? Number(body.latitude) : null, longitude: body.longitude ? Number(body.longitude) : null };
  else if (resource === "trips") payload = { departure_location_id: body.departure_location_id, arrival_location_id: body.arrival_location_id, operator_id: body.operator_id || null, departure_time: body.departure_time, arrival_time: body.arrival_time || null, price: Number(body.price), currency: String(body.currency || "EUR").toUpperCase(), available_seats: Number(body.available_seats), carrier_name: body.carrier_name || null };
  else return fail("Unknown resource.");
  if (Object.values(payload).some((value) => value === "" || value === undefined || (typeof value === "number" && Number.isNaN(value)))) return fail("Please complete all required fields.");
  const { data, error } = await supabase.from(resource).insert(payload).select().single();
  if (error) return fail(error.message, 500); return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!authorized(request)) return fail("Admin access denied.", 401);
  const supabase = client(); if (!supabase) return fail("SUPABASE_SERVICE_ROLE_KEY is not configured.", 503);
  const body = await request.json() as { id?: string; resource?: Resource; changes?: Record<string, unknown> };
  if (!body.id || !body.resource || !body.changes || !["operators", "locations", "trips", "bookings"].includes(body.resource)) return fail("Invalid update payload.");
  const allowed = body.resource === "bookings" ? ["status", "passenger_name", "passenger_email", "qr_code"] : body.resource === "operators" ? ["name", "slug", "support_email"] : body.resource === "locations" ? ["city_name", "station_name", "latitude", "longitude"] : ["departure_location_id", "arrival_location_id", "operator_id", "departure_time", "arrival_time", "price", "currency", "available_seats", "carrier_name"];
  const changes = Object.fromEntries(Object.entries(body.changes).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(changes).length) return fail("No editable fields supplied.");
  const { data, error } = await supabase.from(body.resource).update(changes).eq("id", body.id).select().single();
  if (error) return fail(error.message, 500); return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  if (!authorized(request)) return fail("Admin access denied.", 401);
  const supabase = client(); if (!supabase) return fail("SUPABASE_SERVICE_ROLE_KEY is not configured.", 503);
  const resource = request.nextUrl.searchParams.get("resource") as Resource; const id = request.nextUrl.searchParams.get("id");
  if (!id || !["operators", "locations", "trips"].includes(resource)) return fail("Only operators, locations, or trips can be deleted.");
  const { error } = await supabase.from(resource).delete().eq("id", id);
  if (error) return fail("Cannot delete this record while it is referenced by trips or bookings. Edit it instead.", 409);
  return NextResponse.json({ ok: true });
}
