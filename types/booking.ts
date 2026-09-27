export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";

export type Location = {
  id: string;
  city_name: string;
  station_name: string;
  latitude: number | null;
  longitude: number | null;
};

export type Trip = {
  id: string;
  departure_location_id: string;
  arrival_location_id: string;
  departure_time: string;
  arrival_time: string | null;
  price: number;
  currency: string;
  available_seats: number;
  carrier_name: string | null;
};

export type Booking = {
  id: string;
  trip_id: string;
  passenger_name: string;
  passenger_email: string;
  qr_code: string | null;
  status: BookingStatus;
};
