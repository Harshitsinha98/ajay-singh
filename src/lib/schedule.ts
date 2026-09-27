/**
 * OPD schedule definition and slot generation.
 *
 * The whole no-double-booking guarantee rests on one idea: for a given date, the
 * day is deterministically divided into a fixed, numbered list of slots. A
 * slot's index never changes, its token number is `index + 1`, and the database
 * holds a UNIQUE constraint on (doctor, date, slot index). So two patients
 * physically cannot hold the same minute of the doctor's day, and token numbers
 * always run in chronological order.
 *
 * ────────────────────────────────────────────────────────────────────
 *  ⚠️  READ THIS BEFORE THE SITE GOES LIVE
 *
 *  The sitting hours below are **provisional**. They were not on the clinic's
 *  notice board or in the profile note — the only confirmed facts are the ₹50
 *  fee, the 5-day slip validity, and that Saturday is the weekly off.
 *
 *  A token system cannot exist without hours: a token *is* a time. So rather
 *  than refuse to build it, the hours are guessed here and the guess is flagged
 *  as such — `SCHEDULE_CONFIRMED = false` makes the booking page show an
 *  unmissable banner telling patients the timings are provisional and to confirm
 *  by phone.
 *
 *  Once the real hours are known: correct `sessions`, set `SCHEDULE_CONFIRMED`
 *  to `true`, and the banner disappears. Nothing else needs to change.
 * ────────────────────────────────────────────────────────────────────
 */

import type { Bilingual } from "./doctor";
import {
  addDays,
  dayOfWeek,
  daysBetween,
  formatTime12h,
  istDateKey,
  istMinutesOfDay,
  now,
  toMinutes,
  toTimeKey,
  type DateKey,
  type TimeKey,
} from "./time";

/** The practice has one doctor; this id ties tokens to him in the database. */
export const DOCTOR_ID = "dr-ajay-pundir";

/**
 * Flip to `true` only once the clinic has confirmed the sitting hours below.
 * While it is `false` the booking UI warns every patient that the times are
 * provisional, which is the honest thing to show.
 */
export const SCHEDULE_CONFIRMED = false;

export type OpdSession = {
  id: string;
  label: Bilingual;
  /** Inclusive start of the session, IST wall-clock. */
  start: TimeKey;
  /** Exclusive end of the session, IST wall-clock. */
  end: TimeKey;
  /** Length of one consultation slot, in minutes. */
  slotMinutes: number;
  /** Days this session runs. 0 = Sunday … 6 = Saturday. */
  days: number[];
};

/** Sunday to Friday. Saturday (6) is the confirmed weekly off. */
const SUN_TO_FRI = [0, 1, 2, 3, 4, 5];

/** How far ahead patients may book. */
export const BOOKING_WINDOW_DAYS = 14;

/**
 * A slot must start at least this many minutes from now to be bookable. Stops
 * someone grabbing a token for a time that has effectively passed.
 */
export const MIN_LEAD_MINUTES = 20;

/** ⚠️ PROVISIONAL — see the header note. */
export const sessions: OpdSession[] = [
  {
    id: "morning",
    label: { en: "Morning OPD", hi: "सुबह की ओ.पी.डी." },
    start: "10:00",
    end: "13:00",
    slotMinutes: 10,
    days: SUN_TO_FRI,
  },
  {
    id: "evening",
    label: { en: "Evening OPD", hi: "शाम की ओ.पी.डी." },
    start: "18:00",
    end: "20:00",
    slotMinutes: 10,
    days: SUN_TO_FRI,
  },
];

/**
 * Specific dates the clinic is shut beyond the weekly off — festivals, leave,
 * a camp out of town. Add `YYYY-MM-DD` entries and those days vanish from the
 * picker and refuse bookings.
 */
export const blackoutDates: DateKey[] = [];

/* ------------------------------------------------------------------ */
/* Slot generation                                                     */
/* ------------------------------------------------------------------ */

export type Slot = {
  /**
   * Position of this slot within the doctor's day, starting at 0. Stable for a
   * given date — this is the value the UNIQUE database constraint is built on.
   */
  index: number;
  /** Patient-facing token number. Always `index + 1`. */
  token: number;
  sessionId: string;
  sessionLabel: Bilingual;
  start: TimeKey;
  end: TimeKey;
  startLabel: string;
  endLabel: string;
};

/**
 * Every slot the doctor's day contains, in chronological order.
 * Pure function of the config — no database, no clock.
 */
export function generateSlots(date: DateKey): Slot[] {
  if (blackoutDates.includes(date)) return [];

  const dow = dayOfWeek(date);
  const raw: Omit<Slot, "index" | "token">[] = [];

  for (const session of sessions) {
    if (!session.days.includes(dow)) continue;
    const startM = toMinutes(session.start);
    const endM = toMinutes(session.end);
    for (let m = startM; m + session.slotMinutes <= endM; m += session.slotMinutes) {
      raw.push({
        sessionId: session.id,
        sessionLabel: session.label,
        start: toTimeKey(m),
        end: toTimeKey(m + session.slotMinutes),
        startLabel: formatTime12h(toTimeKey(m)),
        endLabel: formatTime12h(toTimeKey(m + session.slotMinutes)),
      });
    }
  }

  // Sort by clock time so index order == chronological order == token order,
  // regardless of the order sessions happen to be declared in.
  raw.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

  return raw.map((slot, index) => ({ ...slot, index, token: index + 1 }));
}

/** Looks up a single slot by its index. */
export function slotAt(date: DateKey, index: number): Slot | undefined {
  return generateSlots(date).find((s) => s.index === index);
}

/** True when the date lies inside the bookable window. */
export function isBookableDate(date: DateKey, clock?: Date): boolean {
  const today = istDateKey(now(clock));
  const offset = daysBetween(today, date);
  return offset >= 0 && offset <= BOOKING_WINDOW_DAYS;
}

/**
 * True when a slot is still far enough in the future to be claimed.
 * Past slots, and slots inside the lead-time buffer, are refused.
 */
export function isSlotStillOpen(
  date: DateKey,
  slot: Pick<Slot, "start">,
  clock?: Date,
): boolean {
  const current = now(clock);
  const today = istDateKey(current);
  if (date > today) return true;
  if (date < today) return false;
  return toMinutes(slot.start) >= istMinutesOfDay(current) + MIN_LEAD_MINUTES;
}

/** The next `count` dates from today that have at least one bookable slot. */
export function upcomingOpdDates(
  count = BOOKING_WINDOW_DAYS,
  clock?: Date,
): DateKey[] {
  const today = istDateKey(now(clock));
  const dates: DateKey[] = [];
  for (let i = 0; i <= BOOKING_WINDOW_DAYS && dates.length < count; i++) {
    const date = addDays(today, i);
    const slots = generateSlots(date);
    if (!slots.length) continue;
    // Skip today once every remaining slot has slipped past the lead time.
    if (i === 0 && !slots.some((s) => isSlotStillOpen(date, s, clock))) continue;
    dates.push(date);
  }
  return dates;
}

/** Human-readable OPD timing lines, for display on the site. */
export function scheduleSummary(lang: "en" | "hi" = "en"): string[] {
  return sessions.map((session) => {
    const time = `${formatTime12h(session.start)} – ${formatTime12h(session.end)}`;
    const label = lang === "hi" ? session.label.hi : session.label.en;
    return `${label}: ${time}`;
  });
}
