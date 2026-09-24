"use client";

/**
 * Contact.
 *
 * There is no booking form, and that is a decision rather than an omission: a
 * single-doctor OPD with no reception software cannot honour an online slot, and
 * a form that silently goes nowhere is worse than no form. Phone, WhatsApp and
 * walk-in are the real channels, so those are what is offered.
 *
 * The emergency notice is deliberately the loudest element. Anyone landing here
 * mid-crisis needs 108, not this clinic's opening hours.
 */

import { Mail, MapPin, MessageCircle, Phone, Siren } from "lucide-react";
import {
  contact,
  mailtoHref,
  mapsHref,
  telHref,
  whatsappHref,
} from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { Aurora } from "@/components/ui/aurora";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export function Contact() {
  const { t } = useLang();

  const channels = [
    {
      icon: Phone,
      label: t(copy.phoneLabel),
      value: contact.phoneDisplay,
      href: telHref(),
      external: false,
      accent: "text-vaidya-600 bg-vaidya-50 ring-vaidya-100",
    },
    {
      icon: MessageCircle,
      label: t(copy.whatsapp),
      value: contact.phoneDisplay,
      href: whatsappHref(t(copy.whatsappPrefill)),
      external: true,
      accent: "text-[color:var(--color-whatsapp-dark)] bg-vaidya-50 ring-vaidya-100",
    },
    {
      icon: Mail,
      label: t(copy.emailLabel),
      value: contact.email,
      href: mailtoHref(),
      external: false,
      accent: "text-saffron-600 bg-saffron-50 ring-saffron-100",
    },
    {
      icon: MapPin,
      label: t(copy.addressHeading),
      value: t(contact.locality),
      href: mapsHref(),
      external: true,
      accent: "text-bark-700 bg-bark-100 ring-bark-200",
    },
  ];

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-bark-50 py-20 sm:py-24 lg:py-28"
    >
      <Aurora variant="light" className="opacity-60" />

      <div className="relative container-page">
        <SectionHeading
          eyebrow={t(copy.contactEyebrow)}
          lead={t(copy.contactLead)}
          accent={t(copy.contactAccent)}
          intro={t(copy.contactIntro)}
        />

        <RevealGroup as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((channel) => {
            const ChannelIcon = channel.icon;
            return (
              <RevealItem as="li" key={channel.label}>
                <a
                  href={channel.href}
                  {...(channel.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex h-full flex-col rounded-3xl border border-bark-100 bg-white p-6 transition hover:-translate-y-1 hover:border-vaidya-200 hover:shadow-lifted"
                >
                  <span
                    className={`flex size-11 items-center justify-center rounded-2xl ring-1 ${channel.accent}`}
                  >
                    <ChannelIcon className="size-5" strokeWidth={1.9} aria-hidden />
                  </span>
                  <span className="mt-4 text-[0.68rem] font-bold tracking-[0.14em] text-bark-500 uppercase">
                    {channel.label}
                  </span>
                  <span className="mt-1.5 text-sm leading-snug font-bold break-words text-bark-950">
                    {channel.value}
                  </span>
                </a>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* ---------------- emergency notice ---------------- */}
        <Reveal direction="up" delay={0.1}>
          <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-clay-500/30 bg-white p-7 sm:flex-row sm:items-center">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-clay-500/10 text-clay-600">
              <Siren className="size-6" strokeWidth={1.9} aria-hidden />
            </span>

            <div className="flex-1">
              <p className="text-base font-extrabold text-bark-950">
                {t(copy.emergencyHeading)}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-bark-600">
                {t(copy.emergencyBody)}
              </p>
            </div>

            <a
              href="tel:108"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-clay-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-clay-700"
            >
              <Phone className="size-4" strokeWidth={2.3} aria-hidden />
              108
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
