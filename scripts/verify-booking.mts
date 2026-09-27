/**
 * Post-deploy smoke test for the booking system.
 *
 * "Reliable" is not a property you configure once — it is something you confirm
 * after every deploy. This hits a running site and checks, from the outside,
 * that a patient tapping "Book Token" will actually get a token: storage is up,
 * the API answers, and a real booking round-trips through book → look up →
 * cancel, leaving nothing behind.
 *
 * Usage:
 *   npm run verify:booking -- https://your-domain.vercel.app
 *   npm run verify:booking -- http://localhost:3000        (local)
 *
 * Exits non-zero on the first failure, so it doubles as a CI / uptime check.
 * It books a token with an obvious test name and then cancels it, so nothing is
 * left in the register — but run it against production only when you are content
 * with a single throwaway booking appearing and vanishing.
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

let failed = false;
function pass(msg: string) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}
function fail(msg: string) {
  failed = true;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

async function json(path: string, init?: RequestInit) {
  const res = await fetch(base + path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* some errors have no JSON body */
  }
  return { status: res.status, body };
}

console.log(`\n\x1b[1mVerifying booking at ${base}\x1b[0m\n`);

/* 1. Health -------------------------------------------------------------------- */
const health = await json("/api/health");
if (health.status === 200 && health.body?.bookingEnabled) {
  pass(`health: booking enabled (storage: ${health.body.storage?.backend})`);
  if (health.body.storage?.ephemeral) {
    fail("storage is EPHEMERAL — tokens will be lost on restart. Configure Turso.");
  }
  for (const w of health.body.warnings ?? []) {
    console.log(`    \x1b[33m! ${w}\x1b[0m`);
  }
} else {
  fail(
    `health: booking is DOWN (HTTP ${health.status}). ${health.body?.message ?? ""}`,
  );
  console.log(
    "\n\x1b[31mStorage is not configured — nothing else can pass. " +
      "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, then redeploy.\x1b[0m\n",
  );
  process.exit(1);
}

/* 2. Availability -------------------------------------------------------------- */
const avail = await json("/api/availability");
let bookableDate: string | undefined;
if (avail.status === 200 && avail.body?.ok) {
  const withRoom = (avail.body.dates ?? []).find((d: any) => d.free > 0);
  bookableDate = withRoom?.date;
  pass(
    `availability: ${avail.body.dates?.length ?? 0} bookable day(s)` +
      (avail.body.scheduleConfirmed ? "" : " \x1b[33m(timings still provisional)\x1b[0m"),
  );
} else {
  fail(`availability: HTTP ${avail.status}`);
}

/* 3. Full round-trip: book → look up → cancel ---------------------------------- */
if (bookableDate) {
  const testPhone = "9000000000";
  const booked = await json("/api/appointments", {
    method: "POST",
    body: JSON.stringify({
      date: bookableDate,
      patientName: "VERIFY TEST — please ignore",
      patientPhone: testPhone,
      reason: "automated deploy check",
    }),
  });

  if (booked.status === 201 && booked.body?.ok) {
    const ref = booked.body.appointment.reference;
    pass(`book: token ${booked.body.appointment.tokenNumber} (${ref})`);

    const look = await json(
      `/api/appointments?reference=${ref}&phone=${testPhone}`,
    );
    if (look.status === 200 && look.body?.ok) pass("look up: found with code + phone");
    else fail(`look up: HTTP ${look.status}`);

    const wrong = await json(
      `/api/appointments?reference=${ref}&phone=9999999999`,
    );
    if (wrong.status === 404) pass("look up with wrong phone: refused (404)");
    else fail(`look up with wrong phone: expected 404, got ${wrong.status}`);

    const cancel = await json("/api/appointments/cancel", {
      method: "POST",
      body: JSON.stringify({ reference: ref, phone: testPhone }),
    });
    if (cancel.status === 200 && cancel.body?.ok) {
      pass("cancel: test token removed (register left clean)");
    } else {
      fail(
        `cancel: HTTP ${cancel.status} — a test token may be LEFT in the register (${ref}). Cancel it from /admin.`,
      );
    }
  } else {
    fail(`book: HTTP ${booked.status} — ${booked.body?.error ?? ""}`);
  }
} else {
  console.log(
    "  \x1b[33m! no day has a free slot right now — skipped the booking round-trip\x1b[0m",
  );
}

/* 4. Admin is protected -------------------------------------------------------- */
const admin = await json("/api/admin/appointments");
if (admin.status === 401 || admin.status === 503) {
  pass(`admin: protected (HTTP ${admin.status} without passcode)`);
} else {
  fail(`admin: expected 401/503 without passcode, got ${admin.status}`);
}

console.log(
  `\n${failed ? "\x1b[31mFAILED — booking is not fully healthy.\x1b[0m" : "\x1b[32mAll good — booking is live and healthy.\x1b[0m"}\n`,
);
process.exit(failed ? 1 : 0);
