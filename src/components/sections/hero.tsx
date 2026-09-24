"use client";

/**
 * Hero.
 *
 * The job of this block is to answer four questions above the fold: who is
 * this, what do they treat, where are they, and how do I reach them. Everything
 * decorative is subordinate to that — the portrait is the only image, and the
 * two buttons are the two things patients actually do.
 */

import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import {
  contact,
  doctor,
  registration,
  telHref,
  whatsappHref,
} from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { Aurora, EcgLine } from "@/components/ui/aurora";
import { Reveal } from "@/components/ui/reveal";
import { SmartImage } from "@/components/ui/smart-image";

export function Hero() {
  const { t } = useLang();

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-bark-950 pt-32 pb-20 text-white sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28"
    >
      <Aurora variant="dark" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
      <EcgLine className="inset-x-0 bottom-8 h-20 text-vaidya-400/30" />

      <div className="relative container-page">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          {/* ---------------- copy ---------------- */}
          <div>
            <Reveal direction="up">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-vaidya-200 uppercase ring-1 ring-white/15">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-vaidya-400" />
                  <span className="relative size-2 rounded-full bg-vaidya-400" />
                </span>
                {t(copy.heroBadge)}
              </span>
            </Reveal>

            <Reveal direction="up" delay={0.06}>
              <p className="mt-6 text-sm font-bold tracking-[0.2em] text-saffron-300 uppercase">
                {t(doctor.qualification)}
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.1}>
              <h1 className="mt-3 text-4xl leading-[1.1] font-extrabold sm:text-5xl lg:text-[3.4rem]">
                {t(doctor.name)}
              </h1>
            </Reveal>

            <Reveal direction="up" delay={0.16}>
              <p className="mt-4 text-xl font-semibold text-vaidya-200 sm:text-2xl">
                {t(copy.heroTitleLead)}{" "}
                <span className="text-gradient-warm">{t(copy.heroTitleAccent)}</span>
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.22}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-bark-200 sm:text-lg">
                {t(copy.heroIntro)}
              </p>
            </Reveal>

            {/* ---------------- actions ---------------- */}
            <Reveal direction="up" delay={0.28}>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href={telHref()}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-vaidya-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_30px_-10px_rgba(34,161,103,0.8)] transition hover:bg-vaidya-400 sm:text-base"
                >
                  <Phone className="size-4.5" strokeWidth={2.3} aria-hidden />
                  {contact.phoneDisplay}
                </a>

                <a
                  href={whatsappHref(t(copy.whatsappPrefill))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:border-white/50 hover:bg-white/10 sm:text-base"
                >
                  <MessageCircle className="size-4.5" strokeWidth={2.3} aria-hidden />
                  {t(copy.whatsapp)}
                </a>
              </div>
            </Reveal>

            {/* ---------------- registration reassurance ---------------- */}
            <Reveal direction="up" delay={0.34}>
              <p className="mt-7 flex items-start gap-2 text-xs text-bark-300">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-vaidya-400"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>
                  {t(copy.regNumber)}{" "}
                  <strong className="font-semibold text-bark-100">
                    {registration.number}
                  </strong>{" "}
                  · {t(registration.council)}
                </span>
              </p>
            </Reveal>
          </div>

          {/* ---------------- portrait ---------------- */}
          <Reveal direction="left" delay={0.18} scale>
            <figure className="relative mx-auto w-full max-w-sm lg:max-w-none">
              {/* Soft halo so the portrait does not sit flat on the dark panel. */}
              <div
                aria-hidden
                className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-vaidya-400/25 via-transparent to-saffron-400/20 blur-2xl"
              />
              <div className="relative aspect-4/5 overflow-hidden rounded-[2rem] ring-1 ring-white/15">
                <SmartImage
                  src="/images/doctor/dr-ajay-pundir.jpg"
                  alt={t(doctor.name)}
                  caption={t(copy.heroPhotoCaption)}
                  fallbackNote={t(copy.photoComingSoon)}
                  sizes="(min-width: 1024px) 38vw, (min-width: 640px) 60vw, 90vw"
                  priority
                />
              </div>

              <figcaption className="mt-4 text-center text-xs text-bark-400">
                {t(copy.heroPhotoCaption)} · {t(contact.locality)}
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
