/**
 * POST /api/appointments                               — book a token
 * GET  /api/appointments?reference=APC-XXXXXX&phone=…  — look one up
 *
 * The booking engine does all validation and holds the no-overlap guarantee;
 * this route's job is to translate HTTP into an engine call and rate limit abuse.
 */

import { z } from "zod";
import {
  bookAppointment,
  getAppointmentByReference,
  normalisePhone,
  queuePosition,
  type BookingFailureReason,
} from "@/lib/booking";
import { requireStorage } from "@/lib/api-guard";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  slotIndex: z.coerce.number().int().min(0).optional(),
  patientName: z
    .string()
    .trim()
    .min(2, "Please enter the patient's full name")
    .max(80),
  patientPhone: z.string().trim().min(6, "Please enter a mobile number"),
  patientAge: z.coerce.number().int().min(0).max(120).nullish(),
  patientGender: z.enum(["male", "female", "other"]).nullish(),
  reason: z.string().trim().max(400).nullish(),
});

/** Maps engine failures onto sensible HTTP status codes. */
const STATUS_FOR: Record<BookingFailureReason, number> = {
  invalid_date: 400,
  invalid_patient: 400,
  unknown_slot: 400,
  date_out_of_window: 400,
  no_opd_that_day: 409,
  slot_passed: 409,
  slot_taken: 409,
  day_full: 409,
  duplicate_booking: 409,
};

export async function POST(request: Request) {
  // Ten booking attempts per IP per ten minutes is generous for a family
  // booking several members, and useless for a script.
  const limit = rateLimit(clientKey(request, "book"), 10, 10 * 60_000);
  if (!limit.allowed) {
    return tooManyRequests(
      limit,
      "Too many booking attempts. Please wait a few minutes or call the clinic.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Please check the form.",
        field: parsed.error.issues[0]?.path?.[0],
      },
      { status: 400 },
    );
  }

  const unavailable = await requireStorage();
  if (unavailable) return unavailable.response;

  const input = parsed.data;

  const result = await bookAppointment({
    date: input.date,
    slotIndex: input.slotIndex,
    patientName: input.patientName,
    patientPhone: input.patientPhone,
    patientAge: input.patientAge ?? null,
    patientGender: input.patientGender ?? null,
    reason: input.reason ?? null,
    channel: "web",
  });

  if (!result.ok) {
    return Response.json(
      {
        ok: false,
        error: result.message,
        reason: result.reason,
        detail: result.detail,
      },
      { status: STATUS_FOR[result.reason] ?? 400 },
    );
  }

  const { appointment } = result;

  return Response.json(
    {
      ok: true,
      appointment: {
        reference: appointment.reference,
        tokenNumber: appointment.tokenNumber,
        date: appointment.date,
        slotStart: appointment.slotStart,
        slotEnd: appointment.slotEnd,
        patientName: appointment.patientName,
      },
      queueAhead: await queuePosition(appointment),
    },
    { status: 201 },
  );
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const reference = params.get("reference")?.trim().toUpperCase() ?? "";
  const phone = params.get("phone") ?? "";

  if (!reference) {
    return Response.json(
      { ok: false, error: "A booking reference is required." },
      { status: 400 },
    );
  }

  const unavailable = await requireStorage();
  if (unavailable) return unavailable.response;

  const appointment = await getAppointmentByReference(reference);

  /* Require the matching phone number. A reference code is short enough to
     guess at, and appointments carry a patient's name and health context. */
  if (!appointment || normalisePhone(phone) !== appointment.patientPhone) {
    return Response.json(
      { ok: false, error: "No booking found for that code and mobile number." },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    appointment: {
      reference: appointment.reference,
      tokenNumber: appointment.tokenNumber,
      date: appointment.date,
      slotStart: appointment.slotStart,
      slotEnd: appointment.slotEnd,
      patientName: appointment.patientName,
      status: appointment.status,
    },
    queueAhead: await queuePosition(appointment),
  });
}
