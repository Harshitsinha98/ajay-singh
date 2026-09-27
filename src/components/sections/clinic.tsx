"use client";

/**
 * Visiting the clinic.
 *
 * The one section where being wrong has a real cost — someone reads a timing
 * here and travels across Haldwani on the strength of it. So when
 * `consultation.hours.confirmed` is false the card does not guess: it says the
 * hours vary with hospital duty and puts a call button directly in the card.
 * Filling `sessions` in doctor.ts is all that is needed to switch it over.
 */

import Link from "next/link";
import {
  CalendarX2,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Phone,
  Ticket,
} from "lucide-react";
import { consultation, contact, mapsHref, telHref } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function Clinic() {
  const { t } = useLang();

  return (
    <section id="clinic" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div aria-hidden className="absolute inset-0 bg-grid-light opacity-60" />

      <div className="relative container-page">
        <SectionHeading
          eyebrow={t(copy.clinicEyebrow)}
          lead={t(copy.clinicLead)}
          accent={t(copy.clinicAccent)}
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {/* ---------------- address ---------------- */}
          <Reveal direction="up" className="lg:col-span-2">
            <div className="flex h-full flex-col rounded-3xl border border-bark-100 bg-white p-7 shadow-lift">
              <span className="flex items-center gap-2.5 text-vaidya-700">
                <MapPin className="size-5" strokeWidth={1.9} aria-hidden />
                <span className="text-[0.68rem] font-bold tracking-[0.16em] uppercase">
                  {t(copy.addressHeading)}
                </span>
              </span>

              <p className="mt-4 text-lg font-extrabold text-bark-950">
                {t(contact.clinicName)}
              </p>

              <address className="mt-2 text-base leading-relaxed text-bark-700 not-italic">
                {contact.addressLines.map((line, i) => (
                  <span key={i} className="block">
                    {t(line)}
                  </span>
                ))}
              </address>

              <div className="mt-6 flex flex-wrap gap-3 pt-2">
                <a
                  href={mapsHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-bark-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-bark-800"
                >
                  <Navigation className="size-4" strokeWidth={2.2} aria-hidden />
                  {t(copy.getDirections)}
                </a>
                <a
                  href={telHref()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-bark-200 px-5 py-3 text-sm font-bold text-bark-800 transition hover:border-vaidya-300 hover:bg-vaidya-50 hover:text-vaidya-800"
                >
                  <Phone className="size-4" strokeWidth={2.2} aria-hidden />
                  {contact.phoneDisplay}
                </a>
              </div>
            </div>
          </Reveal>

          {/* ---------------- fee ---------------- */}
          <Reveal direction="up" delay={0.06}>
            <div className="flex h-full flex-col justify-between rounded-3xl border border-saffron-200 bg-gradient-to-br from-saffron-50 to-white p-7 shadow-lift">
              <span className="flex items-center gap-2.5 text-saffron-700">
                <IndianRupee className="size-5" strokeWidth={1.9} aria-hidden />
                <span className="text-[0.68rem] font-bold tracking-[0.16em] uppercase">
                  {t(copy.feeHeading)}
                </span>
              </span>

              <div className="mt-5">
                <p className="flex items-baseline gap-1 text-5xl font-extrabold text-bark-950">
                  <span className="text-3xl">₹</span>
                  {consultation.fee}
                </p>
                <p className="mt-2 text-sm font-semibold text-bark-600">
                  {t(consultation.feeNote)}
                </p>
              </div>

              <p className="mt-6 rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-bark-700 ring-1 ring-saffron-100">
                {t({
                  en: `One slip stays valid for ${consultation.prescriptionValidDays} days.`,
                  hi: `एक पर्चा ${consultation.prescriptionValidDays} दिन तक मान्य रहता है।`,
                })}
              </p>
            </div>
          </Reveal>

          {/* ---------------- timings ---------------- */}
          <Reveal direction="up" delay={0.1}>
            <div className="flex h-full flex-col rounded-3xl border border-bark-100 bg-white p-7 shadow-lift">
              <span className="flex items-center gap-2.5 text-vaidya-700">
                <Clock className="size-5" strokeWidth={1.9} aria-hidden />
                <span className="text-[0.68rem] font-bold tracking-[0.16em] uppercase">
                  {t(copy.timingHeading)}
                </span>
              </span>

              {consultation.hours.confirmed && consultation.hours.sessions.length > 0 ? (
                <dl className="mt-4 divide-y divide-bark-100">
                  {consultation.hours.sessions.map((session) => (
                    <div
                      key={t(session.label)}
                      className="flex items-baseline justify-between gap-3 py-2.5"
                    >
                      <dt className="text-sm text-bark-600">{t(session.label)}</dt>
                      <dd className="text-sm font-bold text-bark-950">{t(session.time)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-bark-600">
                    {t(consultation.hours.unconfirmedNote)}
                  </p>
                  <a
                    href={telHref()}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-vaidya-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-vaidya-700"
                  >
                    <Phone className="size-4" strokeWidth={2.2} aria-hidden />
                    {t(copy.callToConfirm)}
                  </a>
                </>
              )}
            </div>
          </Reveal>

          {/* ---------------- weekly off ---------------- */}
          <Reveal direction="up" delay={0.14}>
            <div className="flex h-full flex-col justify-center rounded-3xl border border-clay-500/25 bg-clay-500/5 p-7">
              <span className="flex items-center gap-2.5 text-clay-700">
                <CalendarX2 className="size-5" strokeWidth={1.9} aria-hidden />
                <span className="text-[0.68rem] font-bold tracking-[0.16em] uppercase">
                  {t(copy.closedOn)}
                </span>
              </span>
              <p className="mt-4 text-3xl font-extrabold text-bark-950">
                {t(consultation.weeklyOff)}
              </p>
              <p className="mt-2 text-sm text-bark-600">
                {t({
                  en: "Please do not travel to the clinic on this day.",
                  hi: "इस दिन कृपया क्लीनिक न आएँ।",
                })}
              </p>
            </div>
          </Reveal>

          {/* ---------------- before you come ---------------- */}
          <Reveal direction="up" delay={0.18}>
            <div className="flex h-full flex-col rounded-3xl border border-vaidya-200 bg-vaidya-50 p-7">
              <span className="text-[0.68rem] font-bold tracking-[0.16em] text-vaidya-700 uppercase">
                {t(copy.beforeYouComeHeading)}
              </span>
              <ul className="mt-4 space-y-3">
                {consultation.notes.map((note, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-bark-700">
                    <span
                      aria-hidden
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-vaidya-500"
                    />
                    <span>{t(note)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* ---------------- book a token ---------------- */}
          <Reveal direction="up" delay={0.22} className="lg:col-span-3">
            <div className="flex flex-col items-start gap-5 rounded-3xl bg-bark-950 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="text-[0.68rem] font-bold tracking-[0.16em] text-vaidya-300 uppercase">
                  {t(copy.bookingEyebrow)}
                </p>
                <p className="mt-2 text-xl leading-snug font-extrabold text-white sm:text-2xl">
                  {t(copy.bookingLead)}{" "}
                  <span className="text-gradient-warm">{t(copy.bookingAccent)}</span>
                </p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-bark-300">
                  {t(copy.bookingIntro)}
                </p>
              </div>

              <Link
                href="/book"
                className="inline-flex shrink-0 items-center gap-2.5 rounded-2xl bg-vaidya-500 px-6 py-4 text-sm font-bold text-white transition hover:bg-vaidya-400 sm:text-base"
              >
                <Ticket className="size-5" strokeWidth={2.2} aria-hidden />
                {t(copy.bookToken)}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
