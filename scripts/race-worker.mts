/**
 * One contender in the concurrency test.
 *
 * Spawned as a separate OS process by scripts/test-booking.mts. Running real
 * processes rather than parallel promises in one event loop is the whole point:
 * `Promise.all` inside a single Node process interleaves at await boundaries and
 * can pass even when the database has no concurrency protection at all. Separate
 * processes genuinely contend for the same SQLite file.
 *
 * argv[2] — slot index to fight for, or "auto" to let the engine assign one
 * argv[3] — a unique suffix, so each worker is a distinct patient and the
 *           one-booking-per-patient-per-day index does not mask a slot clash
 *
 * Prints a single line of JSON to stdout.
 */

const slotArg = process.argv[2] ?? "auto";
const tag = process.argv[3] ?? "0";

const { bookAppointment } = await import("../src/lib/booking");

const index = Number(tag);

try {
  const result = await bookAppointment({
    date: process.env.RACE_DATE!,
    slotIndex: slotArg === "auto" ? undefined : Number(slotArg),
    patientName: `Racer ${tag}`,
    // Distinct handset per worker: 9000000000 + index keeps it a valid Indian
    // mobile (leading 9) while guaranteeing uniqueness.
    patientPhone: String(9000000000 + index),
    channel: "web",
  });

  process.stdout.write(
    JSON.stringify(
      result.ok
        ? {
            ok: true,
            token: result.appointment.tokenNumber,
            slotIndex: result.appointment.slotIndex,
            reference: result.appointment.reference,
          }
        : { ok: false, reason: result.reason },
    ) + "\n",
  );
  process.exit(0);
} catch (error) {
  process.stdout.write(
    JSON.stringify({ ok: false, reason: "threw", message: (error as Error).message }) +
      "\n",
  );
  process.exit(1);
}
