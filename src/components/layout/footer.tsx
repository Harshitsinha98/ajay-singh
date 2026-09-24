"use client";

/**
 * Footer.
 *
 * Carries the medical disclaimer, which is the one piece of text on this site
 * that is there for the reader's protection rather than the practice's benefit —
 * so it is given real contrast rather than being greyed into invisibility.
 */

import { MapPin, Mail, MessageCircle, Phone } from "lucide-react";
import {
  contact,
  doctor,
  mailtoHref,
  mapsHref,
  navLinks,
  registration,
  telHref,
  whatsappHref,
} from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { LogoMark } from "./logo";

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-bark-950 text-bark-200">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />

      <div className="relative container-page py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1.2fr]">
          {/* ---------- identity ---------- */}
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="size-12" />
              <div className="min-w-0">
                <p className="text-base font-extrabold text-white">{t(doctor.name)}</p>
                <p className="mt-0.5 text-xs font-semibold tracking-wide text-vaidya-300">
                  {t(doctor.qualification)} · {t(doctor.role)}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-bark-300">
              {t(doctor.tagline)}
            </p>

            <p className="mt-4 text-xs text-bark-400">
              {t(copy.regNumber)} {registration.number} ·{" "}
              {t(registration.council)}
            </p>
          </div>

          {/* ---------- section links ---------- */}
          <nav aria-label={t(copy.footerNav)}>
            <p className="text-xs font-bold tracking-[0.16em] text-white uppercase">
              {t(copy.footerNav)}
            </p>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-bark-300 transition hover:text-white"
                  >
                    {t(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* ---------- reach ---------- */}
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-white uppercase">
              {t(copy.footerReach)}
            </p>

            <address className="mt-4 space-y-3 text-sm not-italic">
              <a
                href={telHref()}
                className="flex items-center gap-2.5 font-semibold text-white transition hover:text-vaidya-300"
              >
                <Phone className="size-4 shrink-0 text-vaidya-400" strokeWidth={2} aria-hidden />
                {contact.phoneDisplay}
              </a>

              <a
                href={whatsappHref(t(copy.whatsappPrefill))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-bark-300 transition hover:text-white"
              >
                <MessageCircle className="size-4 shrink-0 text-vaidya-400" strokeWidth={2} aria-hidden />
                {t(copy.whatsapp)}
              </a>

              <a
                href={mailtoHref()}
                className="flex items-center gap-2.5 break-all text-bark-300 transition hover:text-white"
              >
                <Mail className="size-4 shrink-0 text-vaidya-400" strokeWidth={2} aria-hidden />
                {contact.email}
              </a>

              <a
                href={mapsHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-bark-300 transition hover:text-white"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-vaidya-400" strokeWidth={2} aria-hidden />
                <span>
                  {contact.addressLines.map((line, i) => (
                    <span key={i} className="block">
                      {t(line)}
                    </span>
                  ))}
                </span>
              </a>
            </address>
          </div>
        </div>

        {/* ---------- disclaimer ---------- */}
        <div className="mt-12 rounded-3xl border border-saffron-500/25 bg-saffron-500/10 p-5">
          <p className="text-xs leading-relaxed text-saffron-100">{t(copy.disclaimer)}</p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-bark-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t(doctor.name)}. {t(copy.footerRights)}
          </p>
          <p>{t(contact.locality)}</p>
        </div>
      </div>
    </footer>
  );
}
