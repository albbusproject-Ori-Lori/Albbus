import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Trip } from "@/types/booking";

export type SearchTrip = Trip & {
  departure_location: { city_name: string; station_name: string };
  arrival_location: { city_name: string; station_name: string };
  operator: { name: string } | null;
};

const tripSelect = "*, departure_location:locations!departure_location_id!inner(city_name, station_name), arrival_location:locations!arrival_location_id!inner(city_name, station_name), operator:operators(name)";

export async function getTrip(tripId: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase || !tripId) return { trip: null as SearchTrip | null, configured: Boolean(supabase), error: null };
  const { data, error } = await supabase.from("trips").select(tripSelect).eq("id", tripId).maybeSingle();
  return { trip: (data ?? null) as SearchTrip | null, configured: true, error: error?.message ?? null };
}

export async function searchTrips(from: string, to: string, date: string) {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { trips: [] as SearchTrip[], configured: false, error: null };

  const start = new Date(`${date}T00:00:00+02:00`);
  const end = new Date(`${date}T23:59:59+02:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { trips: [] as SearchTrip[], configured: true, error: "Please select a valid travel date." };
  }

  const { data, error } = await supabase
    .from("trips")
    .select(tripSelect)
    .eq("departure_location.city_name", from)
    .eq("arrival_location.city_name", to)
    .gte("departure_time", start.toISOString())
    .lte("departure_time", end.toISOString())
    .gt("available_seats", 0)
    .order("departure_time", { ascending: true });

  return { trips: (data ?? []) as SearchTrip[], configured: true, error: error?.message ?? null };
}
