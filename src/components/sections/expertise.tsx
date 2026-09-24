"use client";

/**
 * What is treated here.
 *
 * Deliberately framed as complaints in a patient's own words ("body and joint
 * pain", "stomach and digestion") rather than as diagnostic categories. Someone
 * with acidity does not search for "gastroenterology".
 */

import { expertise } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { Icon } from "@/components/ui/icon";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function Expertise() {
  const { t } = useLang();

  return (
    <section id="expertise" className="relative overflow-hidden bg-bark-50 py-20 sm:py-24 lg:py-28">
      <div className="relative container-page">
        <SectionHeading
          eyebrow={t(copy.expertiseEyebrow)}
          lead={t(copy.expertiseLead)}
          accent={t(copy.expertiseAccent)}
          intro={t(copy.expertiseIntro)}
        />

        <RevealGroup
          as="ul"
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {expertise.map((item) => (
            <RevealItem
              as="li"
              key={item.icon}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-bark-100 bg-white p-6 transition hover:-translate-y-1 hover:border-vaidya-200 hover:shadow-lifted"
            >
              {/* Wash that warms up on hover — keeps the grid from reading as
                  eight identical grey boxes. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-gradient-to-b from-vaidya-100/70 to-transparent opacity-0 transition group-hover:opacity-100"
              />

              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-vaidya-50 text-vaidya-600 ring-1 ring-vaidya-100 transition group-hover:bg-vaidya-500 group-hover:text-white">
                <Icon name={item.icon} className="size-6" strokeWidth={1.7} />
              </span>

              <h3 className="relative mt-5 text-lg leading-snug font-bold text-bark-950">
                {t(item.title)}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-bark-600">
                {t(item.detail)}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
