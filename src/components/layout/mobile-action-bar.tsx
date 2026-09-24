"use client";

/**
 * Sticky bottom bar for phones.
 *
 * Almost all of this clinic's traffic will be mobile, and there are exactly
 * three things a visitor wants: call, WhatsApp, directions. Pinning them means
 * none is ever more than one tap away, wherever the visitor has scrolled to.
 * Hidden from `sm` up, where the header already carries the same actions.
 */

import { MapPin, MessageCircle, Phone } from "lucide-react";
import { mapsHref, telHref, whatsappHref } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";

export function MobileActionBar() {
  const { t } = useLang();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-bark-100 bg-white/95 backdrop-blur-xl sm:hidden"
      /* Clears the home-indicator area on modern iPhones. */
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-3 gap-1.5 px-3 pt-2">
        <a
          href={telHref()}
          className="flex flex-col items-center gap-1 rounded-2xl bg-vaidya-600 py-2.5 text-white active:scale-95"
        >
          <Phone className="size-4.5" strokeWidth={2.3} aria-hidden />
          <span className="text-[0.66rem] font-bold">{t(copy.callNow)}</span>
        </a>

        <a
          href={whatsappHref(t(copy.whatsappPrefill))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 rounded-2xl bg-whatsapp py-2.5 text-white active:scale-95"
        >
          <MessageCircle className="size-4.5" strokeWidth={2.3} aria-hidden />
          <span className="text-[0.66rem] font-bold">WhatsApp</span>
        </a>

        <a
          href={mapsHref()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 rounded-2xl bg-bark-950 py-2.5 text-white active:scale-95"
        >
          <MapPin className="size-4.5" strokeWidth={2.3} aria-hidden />
          <span className="text-[0.66rem] font-bold">{t(copy.directions)}</span>
        </a>
      </div>
    </div>
  );
}
