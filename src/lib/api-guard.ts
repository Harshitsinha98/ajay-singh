/**
 * Shared route guard for appointment storage.
 *
 * If the database cannot be opened, a patient must be told to phone the clinic —
 * not shown a generic failure, and certainly not handed a token that was never
 * really stored. Every route that touches appointments calls this first, so that
 * message is identical everywhere.
 */

import { storageStatus } from "./db";
import { contact } from "./doctor";

export type GuardFailure = { response: Response };

/**
 * Returns `null` when storage is healthy, or a ready-to-return 503 otherwise.
 *
 * The patient-facing `error` is bilingual and leads with the phone number. The
 * operator-facing `hint` explains how to fix the deployment and is only included
 * outside production, so a misconfiguration is obvious in development without
 * leaking infrastructure detail to the public.
 */
export async function requireStorage(): Promise<GuardFailure | null> {
  const status = await storageStatus();
  if (status.ready) return null;

  const isProduction = process.env.NODE_ENV === "production";

  return {
    response: Response.json(
      {
        ok: false,
        reason: "storage_unavailable",
        error:
          `Online token booking is temporarily unavailable. Please call ${contact.phoneDisplay} instead. ` +
          `ऑनलाइन टोकन बुकिंग अस्थायी रूप से बंद है। कृपया ${contact.phoneDisplay} पर कॉल करें।`,
        phone: contact.phoneDisplay,
        ...(isProduction ? {} : { hint: status.hint }),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "300" },
      },
    ),
  };
}
