/**
 * Front-desk token register.
 *
 * GET   /api/admin/appointments?date=YYYY-MM-DD  — the day's tokens
 * PATCH /api/admin/appointments                  — mark seen / no-show / cancel
 */

import { z } from "zod";
import { authFailureResponse, checkAdminAuth } from "@/lib/admin-auth";
import { requireStorage } from "@/lib/api-guard";
import {
  cancelAppointment,
  dayStats,
  formatPhoneDisplay,
  listAppointments,
  setAppointmentStatus,
} from "@/lib/booking";
import { storageStatus } from "@/lib/db";
import { SCHEDULE_CONFIRMED } from "@/lib/schedule";
import { istDateKey, isValidDateKey } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = checkAdminAuth(request);
  if (!auth.ok) return authFailureResponse(auth);

  const params = new URL(request.url).searchParams;
  const date = params.get("date") ?? istDateKey();
  if (!isValidDateKey(date)) {
    return Response.json({ ok: false, error: "Invalid date." }, { status: 400 });
  }

  const unavailable = await requireStorage();
  if (unavailable) return unavailable.response;

  const all = await listAppointments({ date });
  const storage = await storageStatus();

  return Response.json(
    {
      ok: true,
      date,
      stats: await dayStats(date),
      tokens: all.map((a) => ({
        reference: a.reference,
        tokenNumber: a.tokenNumber,
        slotStart: a.slotStart,
        slotEnd: a.slotEnd,
        patientName: a.patientName,
        patientPhone: formatPhoneDisplay(a.patientPhone),
        patientAge: a.patientAge,
        patientGender: a.patientGender,
        reason: a.reason,
        channel: a.channel,
        status: a.status,
        createdAt: a.createdAt,
      })),
      totals: {
        booked: all.filter((a) => a.status !== "cancelled").length,
        cancelled: all.filter((a) => a.status === "cancelled").length,
        completed: all.filter((a) => a.status === "completed").length,
        noShow: all.filter((a) => a.status === "no_show").length,
      },
      /* Surfaced so staff can see at a glance whether bookings are durable, and
         whether the published timings are still the provisional guess. */
      health: {
        scheduleConfirmed: SCHEDULE_CONFIRMED,
        storage: storage.ready
          ? { backend: storage.backend, ephemeral: storage.ephemeral }
          : { backend: "unavailable", ephemeral: false },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const patchSchema = z.object({
  reference: z.string().trim().min(4),
  status: z.enum(["confirmed", "completed", "no_show", "cancelled"]),
});

export async function PATCH(request: Request) {
  const auth = checkAdminAuth(request);
  if (!auth.ok) return authFailureResponse(auth);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Provide a reference and a valid status." },
      { status: 400 },
    );
  }

  const unavailable = await requireStorage();
  if (unavailable) return unavailable.response;

  const { reference, status } = parsed.data;

  // Cancelling goes through the engine so the slot is properly released.
  if (status === "cancelled") {
    const result = await cancelAppointment(reference, null);
    if (!result.ok) {
      return Response.json({ ok: false, error: result.message }, { status: 404 });
    }
    return Response.json({ ok: true, appointment: result.appointment });
  }

  const updated = await setAppointmentStatus(reference, status);
  if (!updated) {
    return Response.json({ ok: false, error: "Booking not found." }, { status: 404 });
  }
  return Response.json({ ok: true, appointment: updated });
}
