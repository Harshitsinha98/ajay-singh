"use client";

/**
 * Three-step token booking: day → time → patient details.
 *
 * Notes on the shape of this:
 *
 * • There is no doctor-selection step. One doctor, so asking would be a tap
 *   spent on a question with one answer.
 *
 * • Availability is refetched from the server rather than tracked optimistically.
 *   A clinic queue is genuinely contended — two relatives may book at once — and
 *   a grid that lies about what is free wastes the patient's time at the last
 *   step, which is the worst place to lose them.
 *
 * • When the server refuses because the slot went, the day filled, or the time
 *   passed, the wizard rewinds to a *freshly loaded* slot grid. Showing the same
 *   stale grid with an error above it would invite the identical failure.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  TriangleAlert,
  User,
} from "lucide-react";
import { contact, doctor, whatsappHref } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";

type SlotDto = {
  index: number;
  token: number;
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  sessionLabel: { en: string; hi: string };
  available: boolean;
  unavailableBecause?: "taken" | "passed";
};

type DateDto = {
  date: string;
  free: number;
  total: number;
  labelEn: string;
  labelHi: string;
};

type AvailabilityResponse = {
  ok: boolean;
  availability: { date: string; closed: boolean; slots: SlotDto[]; availableCount: number };
  dates: DateDto[];
  scheduleConfirmed: boolean;
  error?: string;
};

type BookedToken = {
  reference: string;
  tokenNumber: number;
  date: string;
  slotStart: string;
  slotEnd: string;
  patientName: string;
};

const STEPS = [
  { key: "date", label: copy.stepDate, icon: CalendarDays },
  { key: "slot", label: copy.stepSlot, icon: Clock },
  { key: "details", label: copy.stepDetails, icon: User },
];

export function BookingWizard() {
  const { t, lang } = useLang();

  const [step, setStep] = useState(0);
  const [date, setDate] = useState<string | undefined>();
  const [slotIndex, setSlotIndex] = useState<number | undefined>();

  const [dates, setDates] = useState<DateDto[]>([]);
  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [closed, setClosed] = useState(false);
  const [scheduleConfirmed, setScheduleConfirmed] = useState(true);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<BookedToken | null>(null);
  const [queueAhead, setQueueAhead] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  /* ---- availability ---- */

  const loadAvailability = useCallback(
    async (targetDate?: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (targetDate) params.set("date", targetDate);

        const response = await fetch(`/api/availability?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          // A 503 from the storage guard carries a patient-facing sentence with
          // the clinic's phone number in it — far more useful than "failed".
          setError(payload.error ?? t(copy.somethingWrong));
          return null;
        }

        setDates(payload.dates);
        setSlots(payload.availability.slots);
        setClosed(payload.availability.closed);
        setScheduleConfirmed(payload.scheduleConfirmed);
        return payload;
      } catch (caught) {
        if ((caught as Error).name !== "AbortError") {
          setError(t(copy.somethingWrong));
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void loadAvailability(date);
  }, [date, loadAvailability]);

  useEffect(() => () => abortRef.current?.abort(), []);

  /* ---- navigation ---- */

  const chooseDate = (value: string) => {
    setDate(value);
    setSlotIndex(undefined);
    setError(null);
    setStep(1);
  };

  const chooseSlot = (index: number) => {
    setSlotIndex(index);
    setError(null);
    setStep(2);
  };

  /* ---- submit ---- */

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !date || slotIndex === undefined) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          slotIndex,
          patientName: name,
          patientPhone: phone,
          patientAge: age ? Number(age) : null,
          patientGender: gender || null,
          reason: reason || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? t(copy.somethingWrong));
        // The slot went, the day filled, or the time passed — send the patient
        // back to a freshly loaded grid so they choose from reality.
        if (["slot_taken", "day_full", "slot_passed"].includes(payload.reason)) {
          await loadAvailability(date);
          setSlotIndex(undefined);
          setStep(1);
        }
        return;
      }

      setBooked(payload.appointment as BookedToken);
      setQueueAhead(payload.queueAhead ?? 0);
    } catch {
      setError(t(copy.somethingWrong));
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setBooked(null);
    setStep(0);
    setDate(undefined);
    setSlotIndex(undefined);
    setName("");
    setPhone("");
    setAge("");
    setGender("");
    setReason("");
    setError(null);
    void loadAvailability(undefined);
  };

  /* ---- derived ---- */

  const selectedSlot = slots.find((s) => s.index === slotIndex);
  const selectedDate = dates.find((d) => d.date === date);
  const freeSlots = slots.filter((s) => s.available);

  if (booked) {
    return (
      <SuccessCard
        booked={booked}
        queueAhead={queueAhead}
        scheduleConfirmed={scheduleConfirmed}
        onAgain={startOver}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* ---------- provisional-timings warning ---------- */}
      {!scheduleConfirmed && (
        <div className="mb-6 flex gap-3 rounded-3xl border border-saffron-300 bg-saffron-50 p-5">
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-saffron-600"
            strokeWidth={2}
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-saffron-900">
            {t(copy.scheduleProvisional)}{" "}
            <a href={`tel:+${contact.phone}`} className="font-bold underline">
              {contact.phoneDisplay}
            </a>
          </p>
        </div>
      )}

      {/* ---------- progress ---------- */}
      <ol className="flex items-center gap-1.5 sm:gap-3">
        {STEPS.map((entry, index) => {
          const done = index < step;
          const active = index === step;
          const Icon = entry.icon;
          return (
            <li key={entry.key} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index >= step}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left transition sm:px-3.5 ${
                  active
                    ? "bg-bark-950 text-white shadow-lift"
                    : done
                      ? "bg-vaidya-50 text-vaidya-800 ring-1 ring-vaidya-200 hover:bg-vaidya-100"
                      : "bg-bark-100 text-bark-400"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-xl text-xs font-bold ${
                    active
                      ? "bg-white/15 text-white"
                      : done
                        ? "bg-vaidya-500 text-white"
                        : "bg-white text-bark-400"
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" strokeWidth={2.2} aria-hidden />
                  ) : (
                    <Icon className="size-4" strokeWidth={2} aria-hidden />
                  )}
                </span>
                <span className="hidden truncate text-sm font-bold sm:block">
                  {t(entry.label)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* ---------- error ---------- */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex gap-3 rounded-2xl border border-clay-500/40 bg-clay-500/5 p-4"
        >
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-clay-600"
            strokeWidth={2}
            aria-hidden
          />
          <p className="text-sm leading-relaxed font-medium text-bark-800">{error}</p>
        </div>
      )}

      {/* ---------- panel ---------- */}
      <div className="mt-6 rounded-3xl border border-bark-100 bg-white p-6 shadow-lift sm:p-8">
        {/* ===== step 0: day ===== */}
        {step === 0 && (
          <section aria-labelledby="pick-day">
            <h2 id="pick-day" className="text-xl font-extrabold text-bark-950">
              {t(copy.chooseDay)}
            </h2>

            {loading && dates.length === 0 ? (
              <Spinner label={t(copy.loading)} />
            ) : (
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {dates.map((entry) => {
                  const full = entry.free === 0;
                  return (
                    <button
                      key={entry.date}
                      type="button"
                      onClick={() => !full && chooseDate(entry.date)}
                      disabled={full}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                        full
                          ? "cursor-not-allowed border-bark-100 bg-bark-50 text-bark-400"
                          : "border-bark-200 hover:-translate-y-0.5 hover:border-vaidya-400 hover:bg-vaidya-50 hover:shadow-lift"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-bark-950">
                          {lang === "hi" ? entry.labelHi : entry.labelEn}
                        </span>
                        <span className="mt-0.5 block text-xs text-bark-500">
                          {entry.free} / {entry.total} {t(copy.slotsFree)}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-xl px-2.5 py-1 text-xs font-bold ${
                          full
                            ? "bg-bark-200 text-bark-500"
                            : "bg-vaidya-100 text-vaidya-800"
                        }`}
                      >
                        {entry.free}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ===== step 1: time ===== */}
        {step === 1 && (
          <section aria-labelledby="pick-time">
            <BackButton onClick={() => setStep(0)} label={t(copy.back)} />
            <h2 id="pick-time" className="mt-3 text-xl font-extrabold text-bark-950">
              {t(copy.chooseTime)}
            </h2>
            {selectedDate && (
              <p className="mt-1 text-sm text-bark-500">
                {lang === "hi" ? selectedDate.labelHi : selectedDate.labelEn}
              </p>
            )}

            {loading ? (
              <Spinner label={t(copy.loading)} />
            ) : closed ? (
              <Empty message={t(copy.clinicClosedThatDay)} />
            ) : freeSlots.length === 0 ? (
              <Empty message={t(copy.noSlotsLeft)} />
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot.index}
                    type="button"
                    onClick={() => slot.available && chooseSlot(slot.index)}
                    disabled={!slot.available}
                    title={
                      slot.available
                        ? undefined
                        : slot.unavailableBecause === "taken"
                          ? t(copy.slotTaken)
                          : t(copy.slotPassed)
                    }
                    className={`rounded-2xl border p-3 text-center transition ${
                      slot.available
                        ? "border-bark-200 hover:-translate-y-0.5 hover:border-vaidya-400 hover:bg-vaidya-50"
                        : "cursor-not-allowed border-bark-100 bg-bark-50 text-bark-300 line-through"
                    }`}
                  >
                    <span className="block text-sm font-bold text-current">
                      {slot.startLabel}
                    </span>
                    <span
                      className={`mt-0.5 block text-[0.65rem] font-semibold ${
                        slot.available ? "text-vaidya-700" : "text-bark-300"
                      }`}
                    >
                      {t(copy.tokenLabel)} {slot.token}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== step 2: details ===== */}
        {step === 2 && (
          <section aria-labelledby="patient-details">
            <BackButton onClick={() => setStep(1)} label={t(copy.back)} />
            <h2
              id="patient-details"
              className="mt-3 text-xl font-extrabold text-bark-950"
            >
              {t(copy.patientDetails)}
            </h2>

            {selectedSlot && selectedDate && (
              <p className="mt-2 rounded-2xl bg-vaidya-50 px-4 py-3 text-sm font-semibold text-vaidya-900 ring-1 ring-vaidya-100">
                {lang === "hi" ? selectedDate.labelHi : selectedDate.labelEn} ·{" "}
                {selectedSlot.startLabel} · {t(copy.tokenLabel)} {selectedSlot.token}
              </p>
            )}

            <form onSubmit={submit} className="mt-5 grid gap-4">
              <Field label={t(copy.fieldName)} htmlFor="name">
                <input
                  id="name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full rounded-2xl border border-bark-200 px-4 py-3 text-base outline-none focus:border-vaidya-500"
                />
              </Field>

              <Field label={t(copy.fieldPhone)} htmlFor="phone">
                <input
                  id="phone"
                  required
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  placeholder="90000 00000"
                  className="w-full rounded-2xl border border-bark-200 px-4 py-3 text-base outline-none focus:border-vaidya-500"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`${t(copy.fieldAge)} (${t(copy.optional)})`} htmlFor="age">
                  <input
                    id="age"
                    type="number"
                    min={0}
                    max={120}
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-2xl border border-bark-200 px-4 py-3 text-base outline-none focus:border-vaidya-500"
                  />
                </Field>

                <Field
                  label={`${t(copy.fieldGender)} (${t(copy.optional)})`}
                  htmlFor="gender"
                >
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) =>
                      setGender(e.target.value as "male" | "female" | "other" | "")
                    }
                    className="w-full rounded-2xl border border-bark-200 bg-white px-4 py-3 text-base outline-none focus:border-vaidya-500"
                  >
                    <option value="">—</option>
                    <option value="male">{t(copy.genderMale)}</option>
                    <option value="female">{t(copy.genderFemale)}</option>
                    <option value="other">{t(copy.genderOther)}</option>
                  </select>
                </Field>
              </div>

              <Field label={t(copy.fieldReason)} htmlFor="reason">
                <textarea
                  id="reason"
                  rows={3}
                  maxLength={400}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full resize-y rounded-2xl border border-bark-200 px-4 py-3 text-base outline-none focus:border-vaidya-500"
                />
              </Field>

              <p className="text-xs text-bark-500">{t(copy.feeAtCounter)}</p>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-vaidya-600 px-6 py-4 text-base font-bold text-white transition hover:bg-vaidya-700 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    {t(copy.booking)}
                  </>
                ) : (
                  t(copy.confirmBooking)
                )}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-semibold text-bark-800"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-bark-500 transition hover:text-vaidya-700"
    >
      <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden />
      {label}
    </button>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-bark-500">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="mt-5 rounded-2xl bg-bark-50 p-5 text-sm font-medium text-bark-600">
      {message}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Success                                                             */
/* ------------------------------------------------------------------ */

function SuccessCard({
  booked,
  queueAhead,
  scheduleConfirmed,
  onAgain,
}: {
  booked: BookedToken;
  queueAhead: number;
  scheduleConfirmed: boolean;
  onAgain: () => void;
}) {
  const { t, lang } = useLang();

  /**
   * Sending the token over WhatsApp is done by handing the patient a prefilled
   * wa.me link rather than dispatching a message from the server. A server-sent
   * confirmation needs a Meta Business account and an approved template; this
   * needs nothing, and the patient ends up with the token in their own chat
   * history either way.
   */
  const summary =
    lang === "hi"
      ? `${t(doctor.shortName)} — टोकन ${booked.tokenNumber}\nदिनांक: ${booked.date}\nसमय: ${booked.slotStart}\nबुकिंग कोड: ${booked.reference}\nमरीज़: ${booked.patientName}`
      : `${t(doctor.shortName)} — Token ${booked.tokenNumber}\nDate: ${booked.date}\nTime: ${booked.slotStart}\nBooking code: ${booked.reference}\nPatient: ${booked.patientName}`;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-vaidya-200 bg-white shadow-lifted">
        <div className="flex items-center gap-3 bg-vaidya-600 px-6 py-5 text-white">
          <CheckCircle2 className="size-7 shrink-0" strokeWidth={2.2} aria-hidden />
          <p className="text-lg font-extrabold">{t(copy.tokenBooked)}</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.14em] text-bark-500 uppercase">
                {t(copy.yourTokenNumber)}
              </p>
              <p className="mt-1 text-6xl leading-none font-extrabold text-vaidya-700">
                {booked.tokenNumber}
              </p>
            </div>
            <div>
              <p className="text-[0.68rem] font-bold tracking-[0.14em] text-bark-500 uppercase">
                {t(copy.reportBy)}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-bark-950">
                {booked.slotStart}
              </p>
              <p className="text-sm text-bark-500">{booked.date}</p>
            </div>
          </div>

          <dl className="mt-7 divide-y divide-bark-100 border-y border-bark-100">
            <Row label={t(copy.bookingCode)} value={booked.reference} mono />
            <Row label={t(copy.fieldName)} value={booked.patientName} />
            <Row
              label={t(copy.patientsAhead)}
              value={String(queueAhead)}
            />
          </dl>

          <p className="mt-5 rounded-2xl bg-saffron-50 p-4 text-sm leading-relaxed font-medium text-saffron-900 ring-1 ring-saffron-100">
            {t(copy.saveThisCode)} {t(copy.feeAtCounter)}
          </p>

          {!scheduleConfirmed && (
            <p className="mt-3 flex gap-2.5 rounded-2xl border border-saffron-300 bg-white p-4 text-xs leading-relaxed text-saffron-900">
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-saffron-600"
                strokeWidth={2}
                aria-hidden
              />
              <span>{t(copy.scheduleProvisional)}</span>
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={whatsappHref(summary)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-whatsapp px-5 py-3.5 text-sm font-bold text-white transition hover:bg-whatsapp-dark"
            >
              <MessageCircle className="size-4" strokeWidth={2.2} aria-hidden />
              {t(copy.sendToWhatsapp)}
            </a>
            <button
              type="button"
              onClick={onAgain}
              className="inline-flex items-center gap-2 rounded-2xl border border-bark-200 px-5 py-3.5 text-sm font-bold text-bark-800 transition hover:border-vaidya-300 hover:bg-vaidya-50"
            >
              {t(copy.bookAnother)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-xs font-medium text-bark-500">{label}</dt>
      <dd
        className={`text-right text-sm font-bold text-bark-950 ${
          mono ? "font-mono tracking-wider" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
