/**
 * Patient identity helpers.
 *
 * Deliberately kept in their own module with no database import. The booking
 * engine needs them, but so do client components that render a phone number —
 * and if those reached for booking.ts they would drag better-sqlite3, a native
 * addon, into the browser bundle.
 */

/**
 * Reduces an Indian mobile number to bare E.164 digits (`917017428128`).
 * Accepts the many shapes patients type: `+91 70174-28128`, `07017428128`,
 * `7017428128`, `0091 7017428128`.
 */
export function normalisePhone(input: string): string | null {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    // Indian mobile numbers begin 6–9 after the country code.
    return /^91[6-9]\d{9}$/.test(digits) ? digits : null;
  }
  // Allow other country codes through for completeness.
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (/^91\d{10}$/.test(digits)) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return digits ? `+${digits}` : "";
}

/**
 * Collapses a name for duplicate detection: `"  Ram   Kumar "` → `"ramkumar"`.
 * Devanagari is kept in the allowed range, because plenty of patients will give
 * their name in Hindi and stripping it would collapse every such name to "".
 */
export function patientKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
}

export function cleanName(input: string): string {
  return String(input ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
}
