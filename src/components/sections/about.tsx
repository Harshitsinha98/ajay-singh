"use client";

/**
 * About.
 *
 * Two columns: the prose biography, and a credentials panel that reproduces the
 * registration certificate. The certificate detail is given its own bordered
 * card because "is this doctor actually registered" is a question patients are
 * increasingly right to ask, and the answer should be checkable, not implied.
 */

import { credentials, doctor, registration } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { Icon } from "@/components/ui/icon";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function About() {
  const { t } = useLang();

  const certificateRows: Array<[string, string]> = [
    [t(copy.regNumber), registration.number],
    [t(copy.regSerial), registration.serial],
    [t(copy.regDate), t(registration.registeredOn)],
    [t(copy.regValid), t(registration.validTill)],
  ];

  return (
    <section id="about" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div aria-hidden className="absolute inset-0 bg-grid-light opacity-60" />

      <div className="relative container-page">
        <SectionHeading
          eyebrow={t(copy.aboutEyebrow)}
          lead={t(copy.aboutLead)}
          accent={t(copy.aboutAccent)}
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          {/* ---------------- biography ---------------- */}
          <div>
            {doctor.bio.map((paragraph, i) => (
              <Reveal key={i} direction="up" delay={i * 0.08}>
                <p
                  className={`text-base leading-relaxed text-bark-700 sm:text-lg ${
                    i > 0 ? "mt-5" : ""
                  }`}
                >
                  {t(paragraph)}
                </p>
              </Reveal>
            ))}

            {/* credentials grid */}
            <RevealGroup as="ul" className="mt-9 grid gap-3 sm:grid-cols-2">
              {credentials.map((item) => (
                <RevealItem
                  as="li"
                  key={item.icon}
                  className="card-glass rounded-2xl p-4 transition hover:border-vaidya-200 hover:shadow-lift"
                >
                  <span className="flex items-center gap-2 text-vaidya-700">
                    <Icon name={item.icon} className="size-4" strokeWidth={1.9} />
                    <span className="text-[0.68rem] font-bold tracking-[0.12em] uppercase">
                      {t(item.label)}
                    </span>
                  </span>
                  <p className="mt-2 text-sm leading-snug font-semibold text-bark-900">
                    {t(item.value)}
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* ---------------- registration certificate ---------------- */}
          <Reveal direction="left" delay={0.1}>
            <div className="sticky top-28 overflow-hidden rounded-3xl border border-vaidya-200 bg-white shadow-lift">
              <div className="border-b border-vaidya-100 bg-vaidya-50 px-6 py-5">
                <p className="text-[0.68rem] font-bold tracking-[0.16em] text-vaidya-700 uppercase">
                  {t(copy.registrationHeading)}
                </p>
                <p className="mt-2 text-base leading-snug font-extrabold text-bark-950">
                  {t(registration.council)}
                </p>
                <p className="mt-1 text-xs text-bark-500">{t(registration.councilCity)}</p>
              </div>

              <dl className="divide-y divide-bark-100">
                {certificateRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 px-6 py-3.5"
                  >
                    <dt className="text-xs font-medium text-bark-500">{label}</dt>
                    <dd className="text-right text-sm font-bold text-bark-950">{value}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4 px-6 py-3.5">
                  <dt className="text-xs font-medium text-bark-500">
                    {t(copy.regQualification)}
                  </dt>
                  <dd className="text-right text-sm font-bold text-bark-950">
                    {t(registration.qualificationOnCertificate)}
                  </dd>
                </div>
              </dl>

              <p className="border-t border-bark-100 bg-bark-50 px-6 py-4 text-[0.7rem] leading-relaxed text-bark-500">
                {t(copy.verifyNote)}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
