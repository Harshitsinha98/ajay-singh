/**
 * GET /api/health — is the token system actually alive?
 *
 * Made for the moment right after a deploy, when the honest question is "will a
 * patient who taps Book Token get a token, or a phone number?". The rest of the
 * site can be up while booking is quietly dead — the database is a separate
 * dependency and the most likely thing to be misconfigured.
 *
 * This endpoint answers that in one call, in plain language, and returns a
 * non-200 status when booking would fail so a smoke test or an uptime monitor
 * can watch it. It exposes no patient data and never touches the appointments
 * table — only whether storage opens and whether the schedule is confirmed.
 *
 * A crawler has no business here, so it is disallowed in robots.txt alongside
 * the rest of /api.
 */

import { storageStatus } from "@/lib/db";
import { SCHEDULE_CONFIRMED } from "@/lib/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await storageStatus();
  const isProduction = process.env.NODE_ENV === "production";

  if (!status.ready) {
    return Response.json(
      {
        ok: false,
        bookingEnabled: false,
        // The single most useful line: what a deployer must do to fix it.
        message:
          "Booking is DOWN — storage could not be opened. On Vercel this almost always means TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are missing or wrong. See .env.example.",
        // The precise reason is safe to show off production; in production it
        // could leak infrastructure detail, so only the actionable hint stays.
        ...(isProduction ? {} : { reason: status.reason, hint: status.hint }),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      ok: true,
      bookingEnabled: true,
      storage: {
        backend: status.backend, // "libsql" (Turso) or "sqlite" (file)
        ephemeral: status.ephemeral,
      },
      /**
       * A separate flag from `ok`, because durable storage and *correct timings*
       * are different failure modes. Booking can be perfectly durable while
       * still handing out tokens for guessed hours — worth surfacing so nobody
       * advertises the page believing the times are confirmed.
       */
      scheduleConfirmed: SCHEDULE_CONFIRMED,
      warnings: [
        ...(status.ephemeral
          ? [
              "Storage is EPHEMERAL — tokens will be lost when the instance restarts. Configure Turso before taking real bookings.",
            ]
          : []),
        ...(SCHEDULE_CONFIRMED
          ? []
          : [
              "Consultation timings are still the provisional guess. Set SCHEDULE_CONFIRMED = true in src/lib/schedule.ts once the real hours are known.",
            ]),
      ],
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
