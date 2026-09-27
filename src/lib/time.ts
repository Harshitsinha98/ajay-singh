/**
 * All appointment logic runs in India Standard Time.
 *
 * IST is a fixed UTC+05:30 offset and has never observed daylight saving, so the
 * arithmetic is done here explicitly rather than relying on the server's local
 * timezone (which on most hosts, including Vercel, is UTC). This keeps token
 * times identical whether the code runs in Haldwani, Virginia or on a laptop.
 */

export const IST_OFFSET_MINUTES = 330; // +05:30
const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** `YYYY-MM-DD` in IST. */
export type DateKey = string;
/** `HH:MM` in 24-hour IST. */
export type TimeKey = string;

/** Current instant, or an injected one for deterministic tests. */
export function now(clock?: Date): Date {
  return clock ? new Date(clock.getTime()) : new Date();
}

/** Shifts a UTC instant into a Date whose UTC fields read as IST wall-clock. */
function toIstFields(instant: Date): Date {
  return new Date(instant.getTime() + IST_OFFSET_MINUTES * MS_PER_MINUTE);
}

/** `YYYY-MM-DD` for the IST calendar day containing `instant`. */
export function istDateKey(instant: Date = new Date()): DateKey {
  return toIstFields(instant).toISOString().slice(0, 10);
}

/** `HH:MM` IST wall-clock for `instant`. */
export function istTimeKey(instant: Date = new Date()): TimeKey {
  return toIstFields(instant).toISOString().slice(11, 16);
}

/** Minutes since IST midnight for `instant`. */
export function istMinutesOfDay(instant: Date = new Date()): number {
  const f = toIstFields(instant);
  return f.getUTCHours() * 60 + f.getUTCMinutes();
}

/** Day of week for an IST date key. 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(dateKey: DateKey): number {
  return new Date(`${dateKey}T00:00:00Z`).getUTCDay();
}

/** `"09:00"` → `540`. */
export function toMinutes(time: TimeKey): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** `540` → `"09:00"`. */
export function toTimeKey(minutes: number): TimeKey {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
    2,
    "0",
  )}`;
}

/** Adds whole days to an IST date key. */
export function addDays(dateKey: DateKey, days: number): DateKey {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

/** Whole days from `a` to `b` (negative if `b` is earlier). */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_PER_DAY,
  );
}

export function isValidDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  // Rejects impossible dates like 2026-02-31 that the regex would allow.
  // Month 13 makes Date.parse return NaN, so guard before calling toISOString.
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  return new Date(parsed).toISOString().slice(0, 10) === value;
}

/* ------------------------------------------------------------------ */
/* Display formatting                                                  */
/* ------------------------------------------------------------------ */

/** `"14:30"` → `"2:30 PM"`. */
export function formatTime12h(time: TimeKey): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

const HI_MONTHS = [
  "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
  "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर",
];
const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const HI_DAYS = [
  "रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार",
];
const EN_DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** `"2026-09-29"` → `"29 Sep 2026"` / `"29 सितम्बर 2026"`. */
export function formatDate(dateKey: DateKey, lang: "en" | "hi" = "en"): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  const months = lang === "hi" ? HI_MONTHS : EN_MONTHS;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatDayName(dateKey: DateKey, lang: "en" | "hi" = "en"): string {
  const idx = dayOfWeek(dateKey);
  return lang === "hi" ? HI_DAYS[idx] : EN_DAYS[idx];
}

export function dayNameShort(dow: number, lang: "en" | "hi" = "en"): string {
  return lang === "hi"
    ? ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"][dow]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow];
}

/** Human label for a date relative to today in IST. */
export function relativeDayLabel(
  dateKey: DateKey,
  lang: "en" | "hi" = "en",
  clock?: Date,
): string {
  const diff = daysBetween(istDateKey(now(clock)), dateKey);
  if (diff === 0) return lang === "hi" ? "आज" : "Today";
  if (diff === 1) return lang === "hi" ? "कल" : "Tomorrow";
  return formatDayName(dateKey, lang);
}
