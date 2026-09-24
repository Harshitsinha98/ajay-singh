"use client";

/**
 * Career timeline.
 *
 * A vertical rail rather than a year-by-year table, because the source record
 * gives the *order* of postings but not the dates. The visual language follows
 * the data honestly: sequence is shown, duration is not implied.
 */

import { Building2 } from "lucide-react";
import { career, doctor } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function Experience() {
  const { t } = useLang();

  return (
    <section
      id="experience"
      className="relative overflow-hidden bg-bark-950 py-20 text-white sm:py-24 lg:py-28"
    >
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />

      <div className="relative container-page">
        <SectionHeading
          eyebrow={t(copy.experienceEyebrow)}
          lead={t(copy.experienceLead)}
          accent={t(copy.experienceAccent)}
          tone="dark"
          accentTone="warm"
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* ---------------- current post ---------------- */}
          <Reveal direction="right">
            <div className="card-glass-dark sticky top-28 rounded-3xl p-7">
              <p className="text-[0.68rem] font-bold tracking-[0.16em] text-vaidya-300 uppercase">
                {t(copy.currentlyLabel)}
              </p>
              <p className="mt-3 text-2xl leading-tight font-extrabold text-white">
                {t(doctor.currentPost)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-bark-300">
                {t(doctor.role)} · {t(doctor.qualification)}
              </p>

              <div className="mt-6 flex items-baseline gap-2 border-t border-white/10 pt-6">
                <span className="text-4xl font-extrabold text-saffron-300">
                  {doctor.yearsOfExperience}
                </span>
                <span className="text-sm font-semibold text-bark-200">
                  {t({ en: "years of practice", hi: "वर्षों की प्रैक्टिस" })}
                </span>
              </div>
            </div>
          </Reveal>

          {/* ---------------- rail ---------------- */}
          <div>
            {/* The rail is a sibling of the <ol>, not a child of it: an <ol> may
                only contain <li>, and nesting a decorative <span> inside it
                also threw off the nth-child stagger. */}
            <div className="relative">
              <span
                aria-hidden
                className="absolute top-5 bottom-5 left-[0.6875rem] w-px bg-gradient-to-b from-vaidya-400/70 via-white/20 to-transparent"
              />

              <RevealGroup as="ol" className="relative space-y-1 pl-8">
                {career.map((post, index) => {
                  const isLatest = index === career.length - 1;
                  return (
                    <RevealItem
                      as="li"
                      key={t(post.hospital)}
                      className="relative py-3.5"
                    >
                      <span
                        aria-hidden
                        className={`absolute top-5 -left-8 flex size-6 items-center justify-center rounded-full ring-4 ring-bark-950 ${
                          isLatest ? "bg-saffron-400" : "bg-vaidya-500"
                        }`}
                      >
                        <Building2
                          className={`size-3.5 ${isLatest ? "text-bark-950" : "text-white"}`}
                          strokeWidth={2.2}
                        />
                      </span>

                      <p className="text-base leading-snug font-bold text-white sm:text-lg">
                        {t(post.hospital)}
                      </p>
                      {post.note && (
                        <p className="mt-1 text-sm text-bark-300">
                          {t(post.note)}
                        </p>
                      )}
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </div>

            <Reveal direction="up" delay={0.1}>
              <p className="mt-8 border-t border-white/10 pt-6 text-xs leading-relaxed text-bark-400">
                {t(copy.experienceNote)}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
