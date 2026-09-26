/**
 * Booking engine test suite.
 *
 * Run with: npm test
 *
 * Runs against a throwaway local SQLite file, so it is fast and isolated.
 *
 * The important test is the concurrency pair at the bottom — they spawn separate
 * OS processes that all fight for the same slot and assert exactly one wins.
 * Everything else guards the arithmetic around that guarantee.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DB_PATH = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "apc-test-")),
  "test.db",
);

// Pin the backend to a local file. Without this, a TURSO_DATABASE_URL in the
// developer's environment would silently point the tests at the live clinic
// database — and these tests delete every row between cases.
delete process.env.TURSO_DATABASE_URL;
delete process.env.LIBSQL_URL;
delete process.env.DATABASE_URL;
process.env.DATABASE_PATH = DB_PATH;

/* Imports must come after the environment is set, so the storage layer resolves
   against the throwaway file. */
const {
  bookAppointment,
  cancelAppointment,
  getAvailability,
  getAppointmentByReference,
  appointmentsForPhone,
  queuePosition,
  findNextAvailable,
  listAppointments,
  setAppointmentStatus,
} = await import("../src/lib/booking");
const { generateSlots, upcomingOpdDates, sessions, DOCTOR_ID } = await import(
  "../src/lib/schedule"
);
const { wipeAllData, storageStatus } = await import("../src/lib/db");
const { dayOfWeek, addDays, istDateKey, toMinutes } = await import("../src/lib/time");

/* ------------------------------------------------------------------ */
/* Tiny harness                                                        */
/* ------------------------------------------------------------------ */

let passed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (error) {
    failures.push(`${name}\n      ${(error as Error).message}`);
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`      \x1b[31m${(error as Error).message}\x1b[0m`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function section(title: string) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

/**
 * A date with a full day of slots and no lead-time complications. Deliberately
 * not "today": on today, slots before now + MIN_LEAD_MINUTES are unbookable, so
 * assertions about slot 0 would pass or fail depending on the hour the suite is
 * run.
 */
const DATES = upcomingOpdDates();
const DAY = DATES.find((d) => d !== istDateKey()) ?? DATES[0];

type RaceResult = { ok: boolean; token?: number; slotIndex?: number; reason?: string };

/** Spawns `count` worker processes that all try to book at the same moment. */
async function race(slotArg: string, count: number): Promise<RaceResult[]> {
  const runs = Array.from({ length: count }, (_, i) => {
    return new Promise<RaceResult>((resolve) => {
      const child = spawn(
        process.execPath,
        [
          "--import",
          "tsx",
          path.join(process.cwd(), "scripts/race-worker.mts"),
          slotArg,
          String(i),
        ],
        {
          env: {
            ...process.env,
            DATABASE_PATH: DB_PATH,
            RACE_DATE: DAY,
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      let out = "";
      let err = "";
      child.stdout.on("data", (chunk) => (out += chunk));
      child.stderr.on("data", (chunk) => (err += chunk));
      child.on("close", () => {
        const line = out.trim().split("\n").filter(Boolean).pop();
        if (!line) {
          resolve({ ok: false, reason: `no output (stderr: ${err.slice(0, 300)})` });
          return;
        }
        try {
          resolve(JSON.parse(line) as RaceResult);
        } catch {
          resolve({ ok: false, reason: `unparseable: ${line.slice(0, 200)}` });
        }
      });
    });
  });
  return Promise.all(runs);
}

/* ------------------------------------------------------------------ */

console.log(`\n\x1b[1mBooking engine tests\x1b[0m`);
console.log(`\x1b[2mdatabase: ${DB_PATH}\x1b[0m`);
console.log(`\x1b[2mtest day: ${DAY}\x1b[0m`);

/* ---------------- storage ---------------- */

section("Storage");

await test("opens a local SQLite backend", async () => {
  const status = await storageStatus();
  assert(status.ready, "storage not ready");
  equal(status.backend, "sqlite", "backend");
});

/* ---------------- schedule ---------------- */

section("Schedule and slot generation");

await test("Saturday is closed — no slots generated", () => {
  // Walk forward to the next Saturday (day 6) from today.
  let date = istDateKey();
  for (let i = 0; i < 8 && dayOfWeek(date) !== 6; i++) date = addDays(date, 1);
  equal(dayOfWeek(date), 6, "found a Saturday");
  equal(generateSlots(date).length, 0, `slots on Saturday ${date}`);
});

await test("a working day generates the slot count the sessions imply", () => {
  const expected = sessions
    .filter((s) => s.days.includes(dayOfWeek(DAY)))
    .reduce(
      (sum, s) =>
        sum + Math.floor((toMinutes(s.end) - toMinutes(s.start)) / s.slotMinutes),
      0,
    );
  equal(generateSlots(DAY).length, expected, "slot count");
  assert(expected > 0, "expected at least one slot on the test day");
});

await test("token number is always slot index + 1", () => {
  for (const slot of generateSlots(DAY)) {
    equal(slot.token, slot.index + 1, `token for index ${slot.index}`);
  }
});

await test("slots are in strict chronological order", () => {
  const slots = generateSlots(DAY);
  for (let i = 1; i < slots.length; i++) {
    assert(
      toMinutes(slots[i].start) > toMinutes(slots[i - 1].start),
      `slot ${i} (${slots[i].start}) not after slot ${i - 1} (${slots[i - 1].start})`,
    );
  }
});

await test("no bookable date falls on a Saturday", () => {
  for (const d of upcomingOpdDates()) {
    assert(dayOfWeek(d) !== 6, `${d} is a Saturday but was offered`);
  }
});

/* ---------------- booking ---------------- */

section("Booking");

await test("books a token and returns token 1 for slot 0", async () => {
  await wipeAllData();
  const result = await bookAppointment({
    date: DAY,
    slotIndex: 0,
    patientName: "Ramesh Chandra",
    patientPhone: "9876543210",
    channel: "web",
  });
  assert(result.ok, `booking failed: ${!result.ok ? result.message : ""}`);
  equal(result.appointment.tokenNumber, 1, "token number");
  equal(result.appointment.slotIndex, 0, "slot index");
  equal(result.appointment.status, "confirmed", "status");
  equal(result.appointment.doctorId, DOCTOR_ID, "doctor id");
  assert(
    /^APC-[ACDEFGHJKLMNPQRTUVWXY3479]{6}$/.test(result.appointment.reference),
    `unexpected reference format: ${result.appointment.reference}`,
  );
});

await test("normalises the phone number to E.164 digits", async () => {
  await wipeAllData();
  const result = await bookAppointment({
    date: DAY,
    slotIndex: 3,
    patientName: "Sunita Devi",
    patientPhone: "+91 98765-43210",
    channel: "web",
  });
  assert(result.ok, "booking failed");
  equal(result.appointment.patientPhone, "919876543210", "normalised phone");
});

await test("rejects an invalid mobile number", async () => {
  const result = await bookAppointment({
    date: DAY,
    slotIndex: 5,
    patientName: "Test Patient",
    patientPhone: "12345",
    channel: "web",
  });
  assert(!result.ok, "expected failure");
  equal(result.reason, "invalid_patient", "reason");
});

await test("rejects a one-character name", async () => {
  const result = await bookAppointment({
    date: DAY,
    slotIndex: 5,
    patientName: "R",
    patientPhone: "9876543211",
    channel: "web",
  });
  assert(!result.ok, "expected failure");
  equal(result.reason, "invalid_patient", "reason");
});

await test("rejects a date beyond the 14-day window", async () => {
  const result = await bookAppointment({
    date: addDays(istDateKey(), 30),
    patientName: "Far Future",
    patientPhone: "9876543212",
    channel: "web",
  });
  assert(!result.ok, "expected failure");
  equal(result.reason, "date_out_of_window", "reason");
});

await test("refuses to book on a Saturday", async () => {
  let date = istDateKey();
  for (let i = 0; i < 8 && dayOfWeek(date) !== 6; i++) date = addDays(date, 1);
  const result = await bookAppointment({
    date,
    patientName: "Saturday Patient",
    patientPhone: "9876543213",
    channel: "web",
  });
  assert(!result.ok, "expected failure");
  assert(
    result.reason === "no_opd_that_day" || result.reason === "date_out_of_window",
    `unexpected reason: ${result.reason}`,
  );
});

await test("a taken slot is refused with slot_taken", async () => {
  await wipeAllData();
  const first = await bookAppointment({
    date: DAY,
    slotIndex: 7,
    patientName: "First Patient",
    patientPhone: "9111111111",
    channel: "web",
  });
  assert(first.ok, "first booking failed");

  const second = await bookAppointment({
    date: DAY,
    slotIndex: 7,
    patientName: "Second Patient",
    patientPhone: "9222222222",
    channel: "web",
  });
  assert(!second.ok, "expected the second booking to fail");
  equal(second.reason, "slot_taken", "reason");
});

await test("the same patient cannot hold two tokens on one day", async () => {
  await wipeAllData();
  const first = await bookAppointment({
    date: DAY,
    slotIndex: 2,
    patientName: "Mohan Lal",
    patientPhone: "9333333333",
    channel: "web",
  });
  assert(first.ok, "first booking failed");

  const again = await bookAppointment({
    date: DAY,
    slotIndex: 9,
    patientName: "Mohan Lal",
    patientPhone: "9333333333",
    channel: "web",
  });
  assert(!again.ok, "expected duplicate to fail");
  equal(again.reason, "duplicate_booking", "reason");
});

await test("two family members on one handset each get a token", async () => {
  await wipeAllData();
  const a = await bookAppointment({
    date: DAY,
    slotIndex: 2,
    patientName: "Mohan Lal",
    patientPhone: "9333333333",
    channel: "web",
  });
  const b = await bookAppointment({
    date: DAY,
    slotIndex: 3,
    patientName: "Kamla Devi",
    patientPhone: "9333333333",
    channel: "web",
  });
  assert(a.ok && b.ok, "both bookings should succeed on a shared handset");
  assert(a.appointment.tokenNumber !== b.appointment.tokenNumber, "distinct tokens");
});

await test("auto-assign takes the earliest free slot", async () => {
  await wipeAllData();
  await bookAppointment({
    date: DAY,
    slotIndex: 0,
    patientName: "Holder Zero",
    patientPhone: "9444444441",
    channel: "web",
  });
  const auto = await bookAppointment({
    date: DAY,
    patientName: "Auto Patient",
    patientPhone: "9444444442",
    channel: "web",
  });
  assert(auto.ok, "auto-assign failed");
  equal(auto.appointment.slotIndex, 1, "should have taken slot 1");
});

/* ---------------- availability ---------------- */

section("Availability");

await test("booking one slot decrements the available count by one", async () => {
  await wipeAllData();
  const before = await getAvailability(DAY);
  await bookAppointment({
    date: DAY,
    slotIndex: 4,
    patientName: "Counter Test",
    patientPhone: "9555555555",
    channel: "web",
  });
  const after = await getAvailability(DAY);
  equal(after.availableCount, before.availableCount - 1, "available count");
  equal(after.totalSlots, before.totalSlots, "total slots unchanged");
  equal(after.slots[4].available, false, "slot 4 availability");
  equal(after.slots[4].unavailableBecause, "taken", "slot 4 reason");
});

await test("a closed day reports closed with zero slots", async () => {
  let date = istDateKey();
  for (let i = 0; i < 8 && dayOfWeek(date) !== 6; i++) date = addDays(date, 1);
  const day = await getAvailability(date);
  equal(day.closed, true, "closed");
  equal(day.totalSlots, 0, "total slots");
});

await test("findNextAvailable returns a genuinely free slot", async () => {
  await wipeAllData();
  const next = await findNextAvailable();
  assert(next, "expected a next available slot");
  const day = await getAvailability(next.date);
  equal(day.slots[next.slot.index].available, true, "reported slot is free");
});

/* ---------------- lookup, cancel, status ---------------- */

section("Lookup, cancellation and status");

await test("a booking can be fetched by its reference", async () => {
  await wipeAllData();
  const booked = await bookAppointment({
    date: DAY,
    slotIndex: 6,
    patientName: "Lookup Patient",
    patientPhone: "9666666666",
    channel: "web",
  });
  assert(booked.ok, "booking failed");
  const found = await getAppointmentByReference(booked.appointment.reference);
  assert(found, "not found by reference");
  equal(found.tokenNumber, booked.appointment.tokenNumber, "token");
});

await test("reference lookup is case-insensitive", async () => {
  await wipeAllData();
  const booked = await bookAppointment({
    date: DAY,
    slotIndex: 6,
    patientName: "Case Patient",
    patientPhone: "9666666667",
    channel: "web",
  });
  assert(booked.ok, "booking failed");
  const found = await getAppointmentByReference(
    booked.appointment.reference.toLowerCase(),
  );
  assert(found, "lowercase reference should still resolve");
});

await test("cancelling releases the slot back to the pool", async () => {
  await wipeAllData();
  const booked = await bookAppointment({
    date: DAY,
    slotIndex: 8,
    patientName: "Cancel Patient",
    patientPhone: "9777777777",
    channel: "web",
  });
  assert(booked.ok, "booking failed");

  const taken = await getAvailability(DAY);
  equal(taken.slots[8].available, false, "slot 8 should be taken");

  const cancelled = await cancelAppointment(booked.appointment.reference, "9777777777");
  assert(cancelled.ok, "cancellation failed");

  const freed = await getAvailability(DAY);
  equal(freed.slots[8].available, true, "slot 8 should be free again");

  // And the freed slot must be genuinely re-bookable, not just reported free.
  const rebooked = await bookAppointment({
    date: DAY,
    slotIndex: 8,
    patientName: "Second Occupant",
    patientPhone: "9788888888",
    channel: "web",
  });
  assert(rebooked.ok, "should be able to rebook a released slot");
});

await test("cancelling with the wrong phone number is refused", async () => {
  await wipeAllData();
  const booked = await bookAppointment({
    date: DAY,
    slotIndex: 1,
    patientName: "Owner Patient",
    patientPhone: "9811111111",
    channel: "web",
  });
  assert(booked.ok, "booking failed");
  const attempt = await cancelAppointment(booked.appointment.reference, "9822222222");
  assert(!attempt.ok, "expected refusal");
  equal(attempt.reason, "not_yours", "reason");
});

await test("cancelling twice reports already_cancelled", async () => {
  await wipeAllData();
  const booked = await bookAppointment({
    date: DAY,
    slotIndex: 1,
    patientName: "Twice Patient",
    patientPhone: "9833333333",
    channel: "web",
  });
  assert(booked.ok, "booking failed");
  await cancelAppointment(booked.appointment.reference, "9833333333");
  const second = await cancelAppointment(booked.appointment.reference, "9833333333");
  assert(!second.ok, "expected refusal");
  equal(second.reason, "already_cancelled", "reason");
});

await test("an unknown reference is not found", async () => {
  const result = await cancelAppointment("APC-XXXXXX", "9800000000");
  assert(!result.ok, "expected refusal");
  equal(result.reason, "not_found", "reason");
});

await test("a no_show still holds its slot", async () => {
  await wipeAllData();
  const booked = await bookAppointment({
    date: DAY,
    slotIndex: 5,
    patientName: "Absent Patient",
    patientPhone: "9844444444",
    channel: "web",
  });
  assert(booked.ok, "booking failed");
  await setAppointmentStatus(booked.appointment.reference, "no_show");

  const day = await getAvailability(DAY);
  equal(day.slots[5].available, false, "a no-show must not free the slot");
});

await test("queuePosition counts only earlier confirmed tokens", async () => {
  await wipeAllData();
  for (const [i, phone] of ["9851111111", "9852222222", "9853333333"].entries()) {
    const r = await bookAppointment({
      date: DAY,
      slotIndex: i,
      patientName: `Queue ${i}`,
      patientPhone: phone,
      channel: "web",
    });
    assert(r.ok, `booking ${i} failed`);
  }
  const third = (await listAppointments({ date: DAY })).find((a) => a.slotIndex === 2)!;
  equal(await queuePosition(third), 2, "two patients ahead");
});

await test("appointmentsForPhone returns the patient's upcoming tokens", async () => {
  await wipeAllData();
  const booked = await bookAppointment({
    date: DAY,
    slotIndex: 0,
    patientName: "Phone Lookup",
    patientPhone: "9861111111",
    channel: "web",
  });
  assert(booked.ok, "booking failed");
  const mine = await appointmentsForPhone("9861111111");
  equal(mine.length, 1, "one appointment");
  equal(mine[0].reference, booked.appointment.reference, "reference");
});

/* ---------------- concurrency ---------------- */

section("Concurrency (separate OS processes)");

await test("exactly one of 20 processes racing for one slot wins", async () => {
  await wipeAllData();
  const SLOT = 11;
  const CONTENDERS = 20;

  const results = await race(String(SLOT), CONTENDERS);

  const winners = results.filter((r) => r.ok);
  const threw = results.filter((r) => r.reason === "threw" || r.reason?.startsWith("no output") || r.reason?.startsWith("unparseable"));

  assert(
    threw.length === 0,
    `${threw.length} worker(s) errored: ${JSON.stringify(threw.slice(0, 2))}`,
  );
  equal(winners.length, 1, "exactly one winner");
  equal(winners[0].slotIndex, SLOT, "winner holds the contested slot");

  // And the database agrees there is exactly one holder.
  const rows = await listAppointments({ date: DAY });
  equal(rows.filter((a) => a.slotIndex === SLOT).length, 1, "rows for the slot");
});

await test("30 concurrent auto-bookings produce 30 distinct tokens", async () => {
  await wipeAllData();
  const CONTENDERS = 30;
  const capacity = generateSlots(DAY).length;
  assert(capacity >= CONTENDERS, `day has only ${capacity} slots`);

  const results = await race("auto", CONTENDERS);

  const winners = results.filter((r) => r.ok);
  equal(winners.length, CONTENDERS, "every contender should get a token");

  const tokens = new Set(winners.map((r) => r.token));
  equal(tokens.size, CONTENDERS, "all tokens distinct");

  const slots = new Set(winners.map((r) => r.slotIndex));
  equal(slots.size, CONTENDERS, "all slot indexes distinct");
});

/* ------------------------------------------------------------------ */

console.log(
  `\n\x1b[1m${failures.length === 0 ? "\x1b[32mAll passing" : "\x1b[31mFailures"}\x1b[0m` +
    ` — ${passed} passed, ${failures.length} failed\n`,
);

if (failures.length) {
  for (const failure of failures) console.log(`  \x1b[31m•\x1b[0m ${failure}`);
  console.log();
  process.exit(1);
}

// Clean up the throwaway database directory.
fs.rmSync(path.dirname(DB_PATH), { recursive: true, force: true });
