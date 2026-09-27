"use client";

/**
 * Site header.
 *
 * The whole page is a single scrolling document, so the nav is anchor links
 * rather than routes. Two deliberate choices:
 *
 *  • The phone number sits in a strip *above* the nav and is the first thing in
 *    the DOM. For a clinic, "how do I reach you" outranks every other goal.
 *  • The mobile panel is a full-height sheet with large tap targets, because a
 *    good share of visitors are older patients on small phones.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { Languages, Menu, MessageCircle, Phone, Ticket, X } from "lucide-react";
import { contact, doctor, navLinks, telHref, whatsappHref } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { LogoMark, LogoWordmark } from "./logo";

export function Header() {
  const { lang, t, toggle } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  /**
   * Only the home page opens on the dark hero, so only there can the header sit
   * transparent with light text. On /book and /admin the page starts pale, where
   * white-on-white nav links are effectively invisible.
   */
  const overDarkHero = pathname === "/" && !scrolled;

  // Lock body scroll while the sheet is open, and restore it exactly.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the sheet — expected on desktop, harmless on mobile.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-xl focus:bg-bark-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t(copy.skipToContent)}
      </a>

      <header className="fixed inset-x-0 top-0 z-50">
        {/* ---------- contact strip ---------- */}
        <motion.div
          initial={false}
          animate={{ height: scrolled ? 0 : "auto", opacity: scrolled ? 0 : 1 }}
          transition={{ duration: 0.28, ease: "easeInOut" }}
          className="overflow-hidden bg-bark-950 text-white"
        >
          <div className="container-page flex items-center justify-between gap-3 py-2 text-[0.7rem] sm:text-xs">
            <span className="flex min-w-0 items-center gap-2 font-medium">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-vaidya-400" />
                <span className="relative size-2 rounded-full bg-vaidya-500" />
              </span>
              {/* The phone number must never be what gets clipped, so the
                  tagline shortens on narrow screens instead. */}
              <span className="truncate">
                <span className="hidden sm:inline">{t(doctor.tagline)}</span>
                <span className="sm:hidden">{t(doctor.role)}</span>
              </span>
            </span>

            <a
              href={telHref()}
              className="flex shrink-0 items-center gap-1.5 font-semibold text-vaidya-200 transition hover:text-white"
            >
              <Phone className="size-3.5" strokeWidth={2.2} aria-hidden />
              {contact.phoneDisplay}
            </a>
          </div>
        </motion.div>

        {/* ---------- main nav ---------- */}
        <div
          className={`transition-all duration-300 ${
            overDarkHero
              ? "border-b border-white/10 bg-transparent"
              : "border-b border-bark-100/80 bg-white/85 shadow-[0_4px_24px_-12px_rgba(11,23,15,0.2)] backdrop-blur-xl"
          }`}
        >
          <div className="container-page flex items-center justify-between gap-4 py-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={doctor.name.en}>
              <LogoMark className="size-11" />
              <LogoWordmark
                nameHi={doctor.shortName.hi}
                nameEn={doctor.shortName.en}
                sub={t(copy.brandSub)}
                tone={overDarkHero ? "dark" : "light"}
              />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                    overDarkHero
                      ? "text-bark-100 hover:bg-white/10 hover:text-white"
                      : "text-bark-700 hover:bg-vaidya-50 hover:text-vaidya-800"
                  }`}
                >
                  {t(link.label)}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggle}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition ${
                  overDarkHero
                    ? "border-white/25 text-white hover:border-white/50 hover:bg-white/10"
                    : "border-bark-200 text-bark-700 hover:border-vaidya-300 hover:bg-vaidya-50 hover:text-vaidya-800"
                }`}
                aria-label={`Switch to ${lang === "hi" ? "English" : "हिन्दी"}`}
              >
                <Languages className="size-4" strokeWidth={2} aria-hidden />
                <span>{t(copy.languageToggle)}</span>
              </button>

              <a
                href={telHref()}
                className={`hidden size-10 items-center justify-center rounded-xl border transition sm:inline-flex ${
                  overDarkHero
                    ? "border-white/25 text-white hover:bg-white/10"
                    : "border-bark-200 text-bark-700 hover:border-vaidya-300 hover:bg-vaidya-50"
                }`}
                aria-label={`${t(copy.callNow)} ${contact.phoneDisplay}`}
              >
                <Phone className="size-4" strokeWidth={2.2} aria-hidden />
              </a>

              <Link
                href="/book"
                className="hidden items-center gap-2 rounded-xl bg-vaidya-600 px-4 py-2.5 text-sm font-bold text-white shadow-lift transition hover:bg-vaidya-700 sm:inline-flex"
              >
                <Ticket className="size-4" strokeWidth={2.2} aria-hidden />
                {t(copy.bookToken)}
              </Link>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className={`flex size-10 items-center justify-center rounded-xl border transition lg:hidden ${
                  overDarkHero
                    ? "border-white/25 text-white hover:bg-white/10"
                    : "border-bark-200 text-bark-800 hover:bg-bark-50"
                }`}
                aria-label={t(copy.menu)}
                aria-expanded={open}
              >
                <Menu className="size-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- mobile sheet ---------- */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-60 bg-bark-950/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-70 flex w-[min(22rem,88vw)] flex-col bg-white shadow-2xl lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-bark-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <LogoMark className="size-10" />
                  <LogoWordmark
                    nameHi={doctor.shortName.hi}
                    nameEn={doctor.shortName.en}
                    sub={t(copy.brandSub)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-10 items-center justify-center rounded-xl border border-bark-200 text-bark-700"
                  aria-label={t(copy.close)}
                >
                  <X className="size-5" strokeWidth={2} aria-hidden />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.05 }}
                  >
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl px-4 py-3.5 text-base font-semibold text-bark-800 transition hover:bg-vaidya-50 hover:text-vaidya-800"
                    >
                      {t(link.label)}
                    </a>
                  </motion.div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    toggle();
                    setOpen(false);
                  }}
                  className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-base font-semibold text-bark-800 transition hover:bg-vaidya-50"
                >
                  <Languages className="size-5" strokeWidth={1.9} aria-hidden />
                  {t(copy.languageToggle)}
                </button>
              </nav>

              <div className="space-y-2.5 border-t border-bark-100 p-4">
                <Link
                  href="/book"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-bark-950 px-4 py-3.5 text-sm font-bold text-white"
                >
                  <Ticket className="size-4" strokeWidth={2.1} aria-hidden />
                  {t(copy.bookToken)}
                </Link>
                <a
                  href={telHref()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-vaidya-600 px-4 py-3.5 text-sm font-bold text-white"
                >
                  <Phone className="size-4" strokeWidth={2.1} aria-hidden />
                  {contact.phoneDisplay}
                </a>
                <a
                  href={whatsappHref(t(copy.whatsappPrefill))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp px-4 py-3.5 text-sm font-bold text-white"
                >
                  <MessageCircle className="size-4" strokeWidth={2.1} aria-hidden />
                  {t(copy.whatsapp)}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
