"use client";

/**
 * Front-desk token register.
 *
 * Whoever is on the counter opens this on one machine, types the shared
 * passcode, and works down the day's list marking patients seen.
 *
 * On the passcode: it is held in `sessionStorage` and sent as a header on each
 * request, rather than being put in a cookie. That means it dies with the tab —
 * a counter machine left logged in overnight is a realistic risk at a small
 * clinic, and this is the cheapest mitigation. It is not a substitute for real
 * accounts; see the note in lib/admin-auth.ts.
 *
 * This page is `noindex` via the metadata in layout-level robots and is not
 * linked from anywhere on the public site.
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  LogOut,
  RefreshCw,
  X,
} from "lucide-react";

type Token = {
  reference: string;
  tokenNumber: number;
  slotStart: string;
  slotEnd: string;
  patientName: string;
  patientPhone: string;
  patientAge: number | null;
  patientGender: string | null;
  reason: string | null;
  channel: string;
  status: "confirmed" | "completed" | "no_show" | "cancelled";
  createdAt: string;
};

type Register = {
  ok: boolean;
  date: string;
  stats: { total: number; booked: number; available: number; closed: boolean };
  tokens: Token[];
  totals: { booked: number; cancelled: number; completed: number; noShow: number };
  health: {
    scheduleConfirmed: boolean;
    storage: { backend: string; ephemeral: boolean };
  };
  error?: string;
};

const STORAGE_KEY = "apc.admin.passcode";

function todayKey() {
  // IST date, computed the same way the server does it.
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [date, setDate] = useState(todayKey);
  const [data, setData] = useState<Register | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore the passcode from the tab's own session on mount.
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPasscode(stored);
        setAuthed(true);
      }
    } catch {
      /* Storage can throw in private mode; the operator just logs in again. */
    }
  }, []);

  const load = useCallback(
    async (code: string, day: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/appointments?date=${day}`, {
          headers: { "x-admin-passcode": code },
          cache: "no-store",
        });
        const payload = (await response.json()) as Register;
        if (!response.ok) {
          setError(payload.error ?? "Could not load the register.");
          if (response.status === 401) {
            setAuthed(false);
            sessionStorage.removeItem(STORAGE_KEY);
          }
          return;
        }
        setData(payload);
      } catch {
        setError("Network error. Is the server running?");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (authed && passcode) void load(passcode, date);
  }, [authed, passcode, date, load]);

  const signIn = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      sessionStorage.setItem(STORAGE_KEY, passcode);
    } catch {
      /* Not fatal — the passcode just will not survive a reload. */
    }
    setAuthed(true);
  };

  const signOut = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPasscode("");
    setAuthed(false);
    setData(null);
  };

  const setStatus = async (reference: string, status: Token["status"]) => {
    const response = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-passcode": passcode,
      },
      body: JSON.stringify({ reference, status }),
    });
    if (response.ok) await load(passcode, date);
    else {
      const payload = await response.json();
      setError(payload.error ?? "Could not update that token.");
    }
  };

  /* ---------------- sign in ---------------- */

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bark-950 p-6">
        <form
          onSubmit={signIn}
          className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-lifted"
        >
          <h1 className="text-xl font-extrabold text-bark-950">Front desk</h1>
          <p className="mt-1.5 text-sm text-bark-500">
            Enter the counter passcode to open today&rsquo;s token register.
          </p>

          <input
            type="password"
            required
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            className="mt-5 w-full rounded-2xl border border-bark-200 px-4 py-3 text-base outline-none focus:border-vaidya-500"
          />

          {error && (
            <p className="mt-3 rounded-2xl bg-clay-500/5 p-3 text-sm font-medium text-clay-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-2xl bg-vaidya-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-vaidya-700"
          >
            Open register
          </button>
        </form>
      </div>
    );
  }

  /* ---------------- register ---------------- */

  const active = data?.tokens.filter((tk) => tk.status !== "cancelled") ?? [];
  const cancelled = data?.tokens.filter((tk) => tk.status === "cancelled") ?? [];

  return (
    <div className="min-h-screen bg-bark-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        {/* ---------- header ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-bark-950">Token register</h1>
            <p className="mt-0.5 text-sm text-bark-500">
              Dr. Ajay Pundir · डॉ. अजय पुंडीर
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-2xl border border-bark-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-vaidya-500"
            />
            <button
              type="button"
              onClick={() => load(passcode, date)}
              className="inline-flex items-center gap-2 rounded-2xl border border-bark-200 bg-white px-4 py-2.5 text-sm font-bold text-bark-800 transition hover:bg-bark-100"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" strokeWidth={2.2} aria-hidden />
              )}
              Refresh
            </button>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 rounded-2xl border border-bark-200 bg-white px-4 py-2.5 text-sm font-bold text-bark-800 transition hover:bg-bark-100"
            >
              <LogOut className="size-4" strokeWidth={2.2} aria-hidden />
              Sign out
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-2xl border border-clay-500/40 bg-clay-500/5 p-4 text-sm font-medium text-bark-800">
            {error}
          </p>
        )}

        {/* ---------- health warnings ---------- */}
        {data && !data.health.scheduleConfirmed && (
          <p className="mt-5 flex gap-2.5 rounded-2xl border border-saffron-300 bg-saffron-50 p-4 text-sm text-saffron-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
            <span>
              The published consultation timings are still the provisional guess. Set{" "}
              <code className="font-mono font-bold">SCHEDULE_CONFIRMED = true</code> in{" "}
              <code className="font-mono">src/lib/schedule.ts</code> once the real hours
              are known — patients are currently warned that times may change.
            </span>
          </p>
        )}

        {data?.health.storage.ephemeral && (
          <p className="mt-3 flex gap-2.5 rounded-2xl border border-clay-500/40 bg-clay-500/5 p-4 text-sm text-clay-800">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
            <span>
              <strong>Storage is ephemeral.</strong> Tokens will be lost when this
              instance restarts. Configure Turso before taking real bookings.
            </span>
          </p>
        )}

        {/* ---------- stats ---------- */}
        {data && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Booked" value={data.totals.booked} tone="vaidya" />
            <Stat label="Seen" value={data.totals.completed} tone="bark" />
            <Stat label="No-show" value={data.totals.noShow} tone="saffron" />
            <Stat label="Cancelled" value={data.totals.cancelled} tone="clay" />
          </div>
        )}

        {/* ---------- table ---------- */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-bark-200 bg-white">
          {data?.stats.closed ? (
            <p className="p-8 text-center text-sm font-medium text-bark-500">
              The clinic is closed on this date.
            </p>
          ) : active.length === 0 ? (
            <p className="p-8 text-center text-sm font-medium text-bark-500">
              {loading ? "Loading…" : "No tokens booked for this date yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-bark-200 bg-bark-50 text-xs tracking-wide text-bark-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-bold">Token</th>
                    <th className="px-4 py-3 font-bold">Time</th>
                    <th className="px-4 py-3 font-bold">Patient</th>
                    <th className="px-4 py-3 font-bold">Mobile</th>
                    <th className="px-4 py-3 font-bold">Complaint</th>
                    <th className="px-4 py-3 font-bold">Code</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bark-100">
                  {active.map((tk) => (
                    <tr
                      key={tk.reference}
                      className={tk.status === "completed" ? "bg-vaidya-50/50" : ""}
                    >
                      <td className="px-4 py-3">
                        <span className="text-lg font-extrabold text-vaidya-700">
                          {tk.tokenNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap text-bark-900">
                        {tk.slotStart}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-bark-950">
                          {tk.patientName}
                        </span>
                        {(tk.patientAge || tk.patientGender) && (
                          <span className="block text-xs text-bark-500">
                            {[tk.patientAge, tk.patientGender]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={`tel:${tk.patientPhone.replace(/\s/g, "")}`}
                          className="text-bark-700 hover:text-vaidya-700"
                        >
                          {tk.patientPhone}
                        </a>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3 text-bark-600">
                        {tk.reason ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tracking-wider text-bark-500">
                        {tk.reference}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={tk.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <IconAction
                            title="Mark seen"
                            onClick={() => setStatus(tk.reference, "completed")}
                            className="bg-vaidya-100 text-vaidya-700 hover:bg-vaidya-200"
                          >
                            <CheckCircle2 className="size-4" strokeWidth={2.2} />
                          </IconAction>
                          <IconAction
                            title="Mark no-show"
                            onClick={() => setStatus(tk.reference, "no_show")}
                            className="bg-saffron-100 text-saffron-700 hover:bg-saffron-200"
                          >
                            <AlertTriangle className="size-4" strokeWidth={2.2} />
                          </IconAction>
                          <IconAction
                            title="Cancel (frees the slot)"
                            onClick={() => setStatus(tk.reference, "cancelled")}
                            className="bg-clay-500/10 text-clay-700 hover:bg-clay-500/20"
                          >
                            <X className="size-4" strokeWidth={2.4} />
                          </IconAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ---------- cancelled ---------- */}
        {cancelled.length > 0 && (
          <details className="mt-5 rounded-3xl border border-bark-200 bg-white p-5">
            <summary className="cursor-pointer text-sm font-bold text-bark-700">
              {cancelled.length} cancelled token
              {cancelled.length === 1 ? "" : "s"} — slots released
            </summary>
            <ul className="mt-3 space-y-1.5 text-sm text-bark-500">
              {cancelled.map((tk) => (
                <li key={tk.reference}>
                  <span className="font-mono text-xs">{tk.reference}</span> · token{" "}
                  {tk.tokenNumber} · {tk.slotStart} · {tk.patientName}
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* ---------- footer ---------- */}
        {data && (
          <p className="mt-6 flex items-center gap-2 text-xs text-bark-400">
            <Database className="size-3.5" strokeWidth={2} aria-hidden />
            Storage: {data.health.storage.backend}
            {data.health.storage.ephemeral ? " (ephemeral)" : ""} · {data.stats.booked} of{" "}
            {data.stats.total} slots taken
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "vaidya" | "bark" | "saffron" | "clay";
}) {
  const tones: Record<string, string> = {
    vaidya: "text-vaidya-700",
    bark: "text-bark-800",
    saffron: "text-saffron-700",
    clay: "text-clay-700",
  };
  return (
    <div className="rounded-2xl border border-bark-200 bg-white p-4">
      <p className="text-[0.68rem] font-bold tracking-[0.14em] text-bark-500 uppercase">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: Token["status"] }) {
  const map: Record<Token["status"], string> = {
    confirmed: "bg-bark-100 text-bark-700",
    completed: "bg-vaidya-100 text-vaidya-800",
    no_show: "bg-saffron-100 text-saffron-800",
    cancelled: "bg-clay-500/10 text-clay-700",
  };
  const label: Record<Token["status"], string> = {
    confirmed: "Waiting",
    completed: "Seen",
    no_show: "No-show",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`inline-block rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap ${map[status]}`}
    >
      {label[status]}
    </span>
  );
}

function IconAction({
  title,
  onClick,
  className,
  children,
}: {
  title: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-xl transition ${className}`}
    >
      {children}
    </button>
  );
}
