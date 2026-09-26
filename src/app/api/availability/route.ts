/**
 * GET /api/availability?date=YYYY-MM-DD
 *
 * Returns the slot grid for a date, each slot marked available or not, plus the
 * list of bookable dates — so the booking form can render its day picker and
 * slot grid from a single round trip.
 */

import { getAvailability } from "@/lib/booking";
import { requireStorage } from "@/lib/api-guard";
import { SCHEDULE_CONFIRMED, upcomingOpdDates } from "@/lib/schedule";
import { formatDate, istDateKey, isValidDateKey, relativeDayLabel } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date") ?? istDateKey();

  if (!isValidDateKey(date)) {
    return Response.json(
      { ok: false, error: "Invalid date. Expected YYYY-MM-DD." },
      { status: 400 },
    );
  }

  // Checked after input validation so a malformed request still gets a 400.
  const unavailable = await requireStorage();
  if (unavailable) return unavailable.response;

  const availability = await getAvailability(date);

  const dates = await Promise.all(
    upcomingOpdDates().map(async (d) => {
      const day = await getAvailability(d);
      return {
        date: d,
        free: day.availableCount,
        total: day.totalSlots,
        labelEn: `${relativeDayLabel(d, "en")}, ${formatDate(d, "en")}`,
        labelHi: `${relativeDayLabel(d, "hi")}, ${formatDate(d, "hi")}`,
      };
    }),
  );

  return Response.json(
    {
      ok: true,
      availability,
      dates,
      /* Lets the UI warn that the sitting hours are still provisional. See the
         header note in lib/schedule.ts. */
      scheduleConfirmed: SCHEDULE_CONFIRMED,
    },
    // Availability changes the moment anyone books, so never cache it.
    { headers: { "Cache-Control": "no-store" } },
  );
}
