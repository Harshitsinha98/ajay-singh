/**
 * POST /api/appointments/cancel
 *
 * Patient-initiated cancellation. Requires both the booking code and the mobile
 * number it was booked with, so a leaked code alone cannot cancel a token.
 */

import { z } from "zod";
import { cancelAppointment } from "@/lib/booking";
import { requireStorage } from "@/lib/api-guard";
import { clientKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  reference: z.string().trim().min(4).max(20),
  phone: z.string().trim().min(6),
});

export async function POST(request: Request) {
  // Also throttles brute-forcing reference codes against a known phone number.
  const limit = rateLimit(clientKey(request, "cancel"), 15, 10 * 60_000);
  if (!limit.allowed) {
    return tooManyRequests(limit, "Too many attempts. Please try again shortly.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Please provide the booking code and mobile number." },
      { status: 400 },
    );
  }

  const unavailable = await requireStorage();
  if (unavailable) return unavailable.response;

  const result = await cancelAppointment(parsed.data.reference, parsed.data.phone);

  if (!result.ok) {
    // "not found" and "belongs to another number" both answer 404, so the
    // endpoint cannot be used to discover which codes exist.
    const status = result.reason === "already_cancelled" ? 409 : 404;
    const message =
      result.reason === "already_cancelled"
        ? result.message
        : "No booking found for that code and mobile number.";
    return Response.json({ ok: false, error: message }, { status });
  }

  return Response.json({
    ok: true,
    appointment: {
      reference: result.appointment.reference,
      tokenNumber: result.appointment.tokenNumber,
      date: result.appointment.date,
      slotStart: result.appointment.slotStart,
      patientName: result.appointment.patientName,
      status: result.appointment.status,
    },
  });
}
