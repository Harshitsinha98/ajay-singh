"use client";

/**
 * Token cancellation.
 *
 * Both the code and the mobile number are required — the server enforces it, but
 * asking for both here also explains *why* a stranger's code is not enough.
 *
 * Cancelling matters more than it looks: a released slot goes straight back into
 * the pool, so a patient who cancels frees a real token for someone else. Making
 * it easy is what keeps the queue honest.
 */

import { useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";

export function CancelForm() {
  const { t } = useLang();
  const [reference, setReference] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, phone }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? t(copy.somethingWrong));
        return;
      }
      setDone(true);
    } catch {
      setError(t(copy.somethingWrong));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <p className="flex items-center gap-2.5 rounded-2xl border border-vaidya-200 bg-vaidya-50 p-4 text-sm font-semibold text-vaidya-900">
        <CheckCircle2 className="size-5 shrink-0" strokeWidth={2.2} aria-hidden />
        {t(copy.cancelled)}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input
        required
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="APC-XXXXXX"
        aria-label={t(copy.bookingCode)}
        className="rounded-2xl border border-bark-200 px-4 py-3 font-mono text-sm tracking-wider uppercase outline-none focus:border-vaidya-500"
      />
      <input
        required
        type="tel"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="90000 00000"
        aria-label={t(copy.fieldPhone)}
        className="rounded-2xl border border-bark-200 px-4 py-3 text-sm outline-none focus:border-vaidya-500"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-bark-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-bark-800 disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t(copy.cancelling)}
          </>
        ) : (
          t(copy.cancelButton)
        )}
      </button>

      {error && (
        <p
          role="alert"
          className="flex gap-2.5 rounded-2xl border border-clay-500/40 bg-clay-500/5 p-4 text-sm font-medium text-bark-800 sm:col-span-3"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-clay-600"
            strokeWidth={2}
            aria-hidden
          />
          {error}
        </p>
      )}
    </form>
  );
}
