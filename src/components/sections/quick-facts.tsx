"use client";

/**
 * Quick-facts strip.
 *
 * Sits directly under the hero and overlaps it slightly, so the four numbers a
 * patient wants to confirm — experience, fee, slip validity, registration — are
 * the first thing they scroll into.
 */

import { quickFacts } from "@/lib/doctor";
import { useLang } from "@/components/i18n/language-provider";
import { Icon } from "@/components/ui/icon";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";

export function QuickFacts() {
  const { t } = useLang();

  return (
    <section className="relative z-10 -mt-10 sm:-mt-12">
      <div className="container-page">
        <RevealGroup
          as="ul"
          className="grid grid-cols-2 gap-3 rounded-3xl border border-bark-100 bg-white p-4 shadow-lifted sm:gap-4 sm:p-6 lg:grid-cols-4"
        >
          {quickFacts.map((fact) => (
            <RevealItem
              as="li"
              key={fact.icon}
              className="flex items-start gap-3 rounded-2xl p-2 sm:p-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-vaidya-50 text-vaidya-600 ring-1 ring-vaidya-100">
                <Icon name={fact.icon} className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg leading-tight font-extrabold text-bark-950 sm:text-xl">
                  {t(fact.value)}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-bark-500 sm:text-sm">
                  {t(fact.label)}
                </span>
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
