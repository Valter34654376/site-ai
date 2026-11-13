import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://bdfojankowlfuezdhdjl.supabase.co";
/** Public (publishable/anon) key only. Never a service_role key. */
const PUBLIC_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";

let client: SupabaseClient | null = null;
function db() {
  if (!PUBLIC_KEY) return null;
  client ??= createClient(SUPABASE_URL, PUBLIC_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
export const bookingConfigured = () => !!PUBLIC_KEY;

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function formatBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export async function fetchBusyDates(): Promise<Set<string>> {
  const c = db();
  if (!c) throw new Error("unavailable");
  const { data, error } = await c.from("so_public_busy_dates").select("event_date");
  if (error) throw error;
  return new Set((data ?? []).map((r: { event_date: string }) => r.event_date));
}

export type BookingInput = {
  name: string; phone: string; email: string; event_type: string;
  event_date: string; guest_count: number | null; message: string | null;
};
export type BookingResult = "ok" | "date_unavailable" | "recent_request_exists" | "error";

export async function sendBookingRequest(input: BookingInput): Promise<BookingResult> {
  const c = db();
  if (!c) return "error";
  // No .select(): public reads are blocked by design.
  const { error } = await c.from("so_booking_requests").insert(input);
  if (!error) return "ok";
  const text = `${error.message} ${error.details ?? ""} ${error.hint ?? ""}`;
  if (text.includes("date_unavailable")) return "date_unavailable";
  if (text.includes("recent_request_exists")) return "recent_request_exists";
  return "error";
}