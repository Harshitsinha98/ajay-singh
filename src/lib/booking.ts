/**
 * Appointment booking engine.
 *
 * Design notes
 * ------------
 * 1. Tokens are positional, not sequential-on-arrival. Token N is always the
 *    Nth slot of the doctor's day, so a token number tells the patient exactly
 *    when to arrive and the queue is always in clock order.
 *
 * 2. Every write is a **single atomic statement**, and the database carries a
 *    partial UNIQUE index on (doctor, date, slot). The read-then-write race that
 *    plagues naive booking systems therefore cannot produce a double booking:
 *    the loser of the race gets a UNIQUE constraint error and is told the slot
 *    just went. No interactive transaction is held open — which matters, because
 *    on Turso that would mean holding one across a network round trip.
 *
 * 3. Expected failures are returned as typed results, not thrown. The caller
 *    needs to turn each one into a different human sentence.
 *
 * Unlike the system this was ported from, there is no WhatsApp/notification
 * coupling here. Sending a confirmation would need a Meta Business account and a
 * verified template; for a one-doctor clinic the success screen offers a
 * `wa.me` link the patient taps to send the token to themselves, which needs no
 * credentials and no webhook.
 */

import { randomBytes, randomUUID } from "node:crypto";
import {
  db,
  isUniqueViolation,
  uniqueViolationTarget,
  SLOT_HOLDING_STATUSES,
  type AppointmentStatus,
} from "./db";
import {
  DOCTOR_ID,
  generateSlots,
  isBookableDate,
  isSlotStillOpen,
  slotAt,
  upcomingOpdDates,
  type Slot,
} from "./schedule";
import { formatTime12h, istDateKey, isValidDateKey, now, type DateKey } from "./time";
import { cleanName, normalisePhone, patientKey } from "./patient";

/* Re-exported so server-side callers can import everything booking-related from
   one place. Client components must import from ./patient instead, or they will
   pull the database driver into the browser bundle. */
export { cleanName, formatPhoneDisplay, normalisePhone } from "./patient";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type BookingChannel = "web" | "phone" | "walk_in";

export type Appointment = {
  id: string;
  reference: string;
  doctorId: string;
  date: DateKey;
  sessionId: string;
  slotIndex: number;
  tokenNumber: number;
  slotStart: string;
  slotEnd: string;
  patientName: string;
  patientPhone: string;
  patientAge: number | null;
  patientGender: string | null;
  reason: string | null;
  channel: BookingChannel;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
};

export type BookingRequest = {
  date: DateKey;
  /** Omit to have the engine assign the earliest free slot of the day. */
  slotIndex?: number;
  patientName: string;
  patientPhone: string;
  patientAge?: number | null;
  patientGender?: string | null;
  reason?: string | null;
  channel: BookingChannel;
};

export type BookingFailureReason =
  | "invalid_date"
  | "date_out_of_window"
  | "no_opd_that_day"
  | "unknown_slot"
  | "slot_passed"
  | "slot_taken"
  | "day_full"
  | "duplicate_booking"
  | "invalid_patient";

export type BookingResult =
  | { ok: true; appointment: Appointment; slot: Slot }
  | { ok: false; reason: BookingFailureReason; message: string; detail?: string };

export type SlotAvailability = Slot & {
  available: boolean;
  /** Why it is unavailable — lets the UI grey out rather than hide. */
  unavailableBecause?: "taken" | "passed";
};

export type DayAvailability = {
  date: DateKey;
  /** True when there is no OPD at all on this date. */
  closed: boolean;
  slots: SlotAvailability[];
  totalSlots: number;
  availableCount: number;
  nextAvailable: SlotAvailability | null;
};

/* ------------------------------------------------------------------ */
/* Reference codes                                                     */
/* ------------------------------------------------------------------ */

const REFERENCE_ALPHABET = "ACDEFGHJKLMNPQRTUVWXY3479"; // no look-alike glyphs

function makeReference(): string {
  let body = "";
  for (const b of randomBytes(6)) {
    body += REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length];
  }
  return `APC-${body}`;
}

/* ------------------------------------------------------------------ */
/* Row mapping                                                         */
/* ------------------------------------------------------------------ */

type AppointmentRow = {
  id: string;
  reference: string;
  doctor_id: string;
  date: string;
  session_id: string;
  slot_index: number;
  token_number: number;
  slot_start: string;
  slot_end: string;
  patient_name: string;
  patient_phone: string;
  patient_age: number | null;
  patient_gender: string | null;
  reason: string | null;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    reference: row.reference,
    doctorId: row.doctor_id,
    date: row.date,
    sessionId: row.session_id,
    slotIndex: Number(row.slot_index),
    tokenNumber: Number(row.token_number),
    slotStart: row.slot_start,
    slotEnd: row.slot_end,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    patientAge: row.patient_age === null ? null : Number(row.patient_age),
    patientGender: row.patient_gender,
    reason: row.reason,
    channel: row.channel as BookingChannel,
    status: row.status as AppointmentStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const HOLDING_LIST = SLOT_HOLDING_STATUSES.map((s) => `'${s}'`).join(",");

/* ------------------------------------------------------------------ */
/* Availability (read path)                                            */
/* ------------------------------------------------------------------ */

async function takenSlotIndexes(date: DateKey): Promise<Set<number>> {
  const sql = await db();
  const rows = await sql.all<{ slot_index: number }>(
    `SELECT slot_index FROM appointments
      WHERE doctor_id = ? AND date = ? AND status IN (${HOLDING_LIST})`,
    [DOCTOR_ID, date],
  );
  return new Set(rows.map((r) => Number(r.slot_index)));
}

export async function getAvailability(
  date: DateKey,
  clock?: Date,
): Promise<DayAvailability> {
  const slots = generateSlots(date);
  if (!slots.length) {
    return {
      date,
      closed: true,
      slots: [],
      totalSlots: 0,
      availableCount: 0,
      nextAvailable: null,
    };
  }

  const taken = await takenSlotIndexes(date);
  const enriched: SlotAvailability[] = slots.map((slot) => {
    if (taken.has(slot.index)) {
      return { ...slot, available: false, unavailableBecause: "taken" };
    }
    if (!isSlotStillOpen(date, slot, clock)) {
      return { ...slot, available: false, unavailableBecause: "passed" };
    }
    return { ...slot, available: true };
  });

  const open = enriched.filter((s) => s.available);
  return {
    date,
    closed: false,
    slots: enriched,
    totalSlots: enriched.length,
    availableCount: open.length,
    nextAvailable: open[0] ?? null,
  };
}

/** Scans forward through the booking window for the first free slot. */
export async function findNextAvailable(
  clock?: Date,
): Promise<{ date: DateKey; slot: SlotAvailability } | null> {
  for (const date of upcomingOpdDates(14, clock)) {
    const day = await getAvailability(date, clock);
    if (day.nextAvailable) return { date, slot: day.nextAvailable };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Booking (write path)                                                */
/* ------------------------------------------------------------------ */

function fail(
  reason: BookingFailureReason,
  message: string,
  detail?: string,
): BookingResult {
  return { ok: false, reason, message, detail };
}

const INSERT_SQL = `
  INSERT INTO appointments (
    id, reference, doctor_id, date, session_id,
    slot_index, token_number, slot_start, slot_end,
    patient_name, patient_key, patient_phone, patient_age, patient_gender,
    reason, channel, status, created_at, updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'confirmed',?,?)
`;

export async function bookAppointment(
  request: BookingRequest,
  clock?: Date,
): Promise<BookingResult> {
  /* ---- validate the request before touching the database ---- */

  if (!isValidDateKey(request.date)) {
    return fail("invalid_date", "That date is not valid.");
  }
  if (!isBookableDate(request.date, clock)) {
    return fail(
      "date_out_of_window",
      "Tokens can only be booked for today up to 14 days ahead.",
    );
  }

  const name = cleanName(request.patientName);
  if (name.length < 2) {
    return fail("invalid_patient", "Please give the patient's full name.");
  }
  const phone = normalisePhone(request.patientPhone);
  if (!phone) {
    return fail("invalid_patient", "That mobile number does not look right.");
  }

  const daySlots = generateSlots(request.date);
  if (!daySlots.length) {
    return fail("no_opd_that_day", "The clinic is closed on that date.");
  }

  /* ---- resolve which slot we are claiming ---- */

  const explicitSlot = request.slotIndex !== undefined;
  let candidates: Slot[];

  if (explicitSlot) {
    const slot = slotAt(request.date, request.slotIndex!);
    if (!slot) {
      return fail("unknown_slot", "That appointment time is not on the schedule.");
    }
    if (!isSlotStillOpen(request.date, slot, clock)) {
      return fail(
        "slot_passed",
        `The ${slot.startLabel} slot has already passed. Please pick a later time.`,
      );
    }
    candidates = [slot];
  } else {
    // Auto-assign: walk the day in order and take the first slot that sticks.
    candidates = daySlots.filter((s) => isSlotStillOpen(request.date, s, clock));
    if (!candidates.length) {
      return fail(
        "day_full",
        "No consultation time is left for that date. Please choose another day.",
      );
    }
  }

  /* ---- claim it ---- */

  const sql = await db();

  /**
   * A single INSERT is the whole claim. If a concurrent request already holds
   * the slot, the partial UNIQUE index rejects this row and we move on to the
   * next candidate. No transaction, no lock held over the network.
   */
  const claim = async (slot: Slot): Promise<Appointment> => {
    const ts = new Date().toISOString();
    const reference = makeReference();
    await sql.run(INSERT_SQL, [
      randomUUID(),
      reference,
      DOCTOR_ID,
      request.date,
      slot.sessionId,
      slot.index,
      slot.token,
      slot.start,
      slot.end,
      name,
      patientKey(name),
      phone,
      request.patientAge ?? null,
      request.patientGender ?? null,
      request.reason?.trim()?.slice(0, 400) || null,
      request.channel,
      ts,
      ts,
    ]);
    return (await getAppointmentByReference(reference))!;
  };

  for (const slot of candidates) {
    try {
      const appointment = await claim(slot);
      return { ok: true, appointment, slot };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      const target = uniqueViolationTarget(error);

      if (target === "patient") {
        const existing = await findActiveAppointment(request.date, phone, name);
        return fail(
          "duplicate_booking",
          existing
            ? `${name} already has token ${existing.tokenNumber} at ${formatTime12h(
                existing.slotStart,
              )} on this date.`
            : `${name} already has a token on that date.`,
          existing?.reference,
        );
      }

      if (target === "reference") {
        // Astronomically unlikely 6-character collision — retry this slot once.
        try {
          const appointment = await claim(slot);
          return { ok: true, appointment, slot };
        } catch {
          continue;
        }
      }

      if (explicitSlot) {
        const day = await getAvailability(request.date, clock);
        return fail(
          "slot_taken",
          day.nextAvailable
            ? `That time was just taken. The next free slot is ${day.nextAvailable.startLabel} (token ${day.nextAvailable.token}).`
            : "That time was just taken and no other slot is left for the day.",
          day.nextAvailable ? String(day.nextAvailable.index) : undefined,
        );
      }
      // Auto-assign: fall through and try the next slot.
    }
  }

  return fail(
    explicitSlot ? "slot_taken" : "day_full",
    "All tokens for that date have been taken. Please choose another day.",
  );
}

/* ------------------------------------------------------------------ */
/* Reads & mutations                                                   */
/* ------------------------------------------------------------------ */

export async function getAppointmentByReference(
  reference: string,
): Promise<Appointment | null> {
  const sql = await db();
  const row = await sql.get<AppointmentRow>(
    `SELECT * FROM appointments WHERE reference = ?`,
    [reference.trim().toUpperCase()],
  );
  return row ? mapRow(row) : null;
}

export async function findActiveAppointment(
  date: DateKey,
  phone: string,
  name: string,
): Promise<Appointment | null> {
  const sql = await db();
  const row = await sql.get<AppointmentRow>(
    `SELECT * FROM appointments
      WHERE doctor_id = ? AND date = ? AND patient_phone = ?
        AND patient_key = ? AND status = 'confirmed'`,
    [DOCTOR_ID, date, phone, patientKey(name)],
  );
  return row ? mapRow(row) : null;
}

/** Upcoming confirmed appointments for a handset, soonest first. */
export async function appointmentsForPhone(
  phone: string,
  options: { includePast?: boolean } = {},
  clock?: Date,
): Promise<Appointment[]> {
  const normalised = normalisePhone(phone);
  if (!normalised) return [];
  const sql = await db();
  const today = istDateKey(now(clock));

  const rows = options.includePast
    ? await sql.all<AppointmentRow>(
        `SELECT * FROM appointments
          WHERE patient_phone = ? AND status = 'confirmed'
          ORDER BY date ASC, slot_index ASC LIMIT 20`,
        [normalised],
      )
    : await sql.all<AppointmentRow>(
        `SELECT * FROM appointments
          WHERE patient_phone = ? AND status = 'confirmed' AND date >= ?
          ORDER BY date ASC, slot_index ASC LIMIT 20`,
        [normalised, today],
      );
  return rows.map(mapRow);
}

export async function listAppointments(filter: {
  date?: DateKey;
  status?: AppointmentStatus;
}): Promise<Appointment[]> {
  const clauses: string[] = ["doctor_id = ?"];
  const params: unknown[] = [DOCTOR_ID];
  if (filter.date) {
    clauses.push("date = ?");
    params.push(filter.date);
  }
  if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }

  const sql = await db();
  const rows = await sql.all<AppointmentRow>(
    `SELECT * FROM appointments WHERE ${clauses.join(" AND ")}
      ORDER BY date ASC, slot_index ASC LIMIT 500`,
    params,
  );
  return rows.map(mapRow);
}

export type CancelResult =
  | { ok: true; appointment: Appointment }
  | {
      ok: false;
      reason: "not_found" | "not_yours" | "already_cancelled";
      message: string;
    };

/**
 * Cancels a token and releases its slot back to the pool.
 *
 * `phone` is required for patient-initiated cancellations, so a reference code
 * alone cannot be used to cancel a stranger's appointment; staff pass `null`.
 *
 * The UPDATE is conditional on the row not already being cancelled, so two
 * concurrent cancellations resolve cleanly: one affects a row, the other affects
 * none and is told it was already cancelled.
 */
export async function cancelAppointment(
  reference: string,
  phone: string | null,
): Promise<CancelResult> {
  const appointment = await getAppointmentByReference(reference);
  if (!appointment) {
    return {
      ok: false,
      reason: "not_found",
      message: "No booking found with that code.",
    };
  }
  if (phone !== null) {
    const normalised = normalisePhone(phone);
    if (normalised !== appointment.patientPhone) {
      return {
        ok: false,
        reason: "not_yours",
        message: "That booking code belongs to a different mobile number.",
      };
    }
  }

  const sql = await db();
  const ts = new Date().toISOString();
  const { rowsAffected } = await sql.run(
    `UPDATE appointments
        SET status = 'cancelled', cancelled_at = ?, updated_at = ?
      WHERE id = ? AND status != 'cancelled'`,
    [ts, ts, appointment.id],
  );

  if (rowsAffected === 0) {
    return {
      ok: false,
      reason: "already_cancelled",
      message: "That booking was already cancelled.",
    };
  }

  return { ok: true, appointment: { ...appointment, status: "cancelled" } };
}

export async function setAppointmentStatus(
  reference: string,
  status: AppointmentStatus,
): Promise<Appointment | null> {
  const sql = await db();
  const { rowsAffected } = await sql.run(
    `UPDATE appointments SET status = ?, updated_at = ? WHERE reference = ?`,
    [status, new Date().toISOString(), reference.trim().toUpperCase()],
  );
  if (rowsAffected === 0) return null;
  return getAppointmentByReference(reference);
}

/** How many patients hold an earlier token on the same day. */
export async function queuePosition(appointment: Appointment): Promise<number> {
  const sql = await db();
  const row = await sql.get<{ ahead: number }>(
    `SELECT COUNT(*) AS ahead FROM appointments
      WHERE doctor_id = ? AND date = ? AND slot_index < ?
        AND status = 'confirmed'`,
    [appointment.doctorId, appointment.date, appointment.slotIndex],
  );
  return Number(row?.ahead ?? 0);
}

export async function dayStats(date: DateKey) {
  const availability = await getAvailability(date);
  const booked = (await listAppointments({ date })).filter(
    (a) => a.status !== "cancelled",
  );
  return {
    date,
    closed: availability.closed,
    total: availability.totalSlots,
    booked: booked.length,
    available: availability.availableCount,
  };
}
