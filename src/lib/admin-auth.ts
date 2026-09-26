/**
 * Front-desk authentication.
 *
 * A single shared passcode, compared in constant time. This is intentionally
 * modest: the admin screen is used by whoever is on the counter, and a full user
 * system would be more to go wrong than it protects for a one-doctor clinic.
 * Swap for real accounts if a per-user audit trail is ever needed.
 */

import { createHash, timingSafeEqual } from "node:crypto";

export type AuthOutcome =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

function digest(value: string): Buffer {
  // Hashing first means the comparison is over fixed-length buffers, so the
  // passcode's length does not leak through timingSafeEqual's length check.
  return createHash("sha256").update(value, "utf8").digest();
}

export function checkAdminAuth(request: Request): AuthOutcome {
  const expected = process.env.ADMIN_PASSCODE;

  if (!expected || expected.length < 6) {
    return {
      ok: false,
      status: 503,
      error:
        "Admin access is not configured. Set ADMIN_PASSCODE (at least 6 characters) in the environment.",
    };
  }

  const supplied =
    request.headers.get("x-admin-passcode") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (!supplied || !timingSafeEqual(digest(supplied), digest(expected))) {
    return { ok: false, status: 401, error: "Incorrect passcode." };
  }

  return { ok: true };
}

export function authFailureResponse(
  outcome: Extract<AuthOutcome, { ok: false }>,
) {
  return Response.json(
    { ok: false, error: outcome.error },
    { status: outcome.status },
  );
}
