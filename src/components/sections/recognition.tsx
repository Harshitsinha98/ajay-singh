"use client";

/**
 * Community work and recognition.
 *
 * Three citations, presented as cards rather than as a trophy shelf. The point
 * being made is about years of free camp work, so the *detail* line carries the
 * weight and the award title is deliberately the smaller element.
 */

import { Award } from "lucide-react";
import { recognition } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function Recognition() {
  const { t } = useLang();

  return (
    <section
      id="recognition"
      className="relative overflow-hidden bg-bark-50 py-20 sm:py-24 lg:py-28"
    >
      <div className="relative container-page">
        <SectionHeading
          eyebrow={t(copy.recognitionEyebrow)}
          lead={t(copy.recognitionLead)}
          accent={t(copy.recognitionAccent)}
          intro={t(copy.recognitionIntro)}
          accentTone="warm"
        />

        <RevealGroup as="ul" className="mt-14 grid gap-5 lg:grid-cols-3">
          {recognition.map((item) => (
            <RevealItem
              as="li"
              key={t(item.title) + t(item.date)}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-bark-100 bg-white p-7 transition hover:-translate-y-1 hover:border-saffron-200 hover:shadow-lifted"
            >
              {/* Saffron corner glow — the colour of the framed citations. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-saffron-200/40 blur-2xl transition group-hover:bg-saffron-300/50"
              />

              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-600 ring-1 ring-saffron-100">
                <Award className="size-6" strokeWidth={1.7} aria-hidden />
              </span>

              <p className="relative mt-5 text-[0.68rem] font-bold tracking-[0.16em] text-saffron-700 uppercase">
                {t(item.title)}
              </p>

              <h3 className="relative mt-2 text-lg leading-snug font-bold text-bark-950">
                {t(item.awardedBy)}
              </h3>

              <p className="relative mt-1 text-xs font-semibold text-bark-500">
                {t(item.date)}
              </p>

              <p className="relative mt-4 flex-1 text-sm leading-relaxed text-bark-600">
                {t(item.detail)}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
