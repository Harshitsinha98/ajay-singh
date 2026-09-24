"use client";

/**
 * Gallery.
 *
 * A masonry-ish grid: the certificates are portrait-shaped and the clinic photos
 * are landscape, so forcing one aspect ratio on everything would crop the
 * registration number off the certificate. `portrait` in the data controls the
 * row span instead.
 *
 * Every tile goes through <SmartImage>, so a photograph that has not been added
 * yet shows a designed placeholder rather than a broken image.
 */

import { gallery } from "@/lib/doctor";
import { copy } from "@/lib/copy";
import { useLang } from "@/components/i18n/language-provider";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { SmartImage } from "@/components/ui/smart-image";

export function Gallery() {
  const { t } = useLang();

  return (
    <section id="gallery" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div aria-hidden className="absolute inset-0 bg-grid-light opacity-60" />

      <div className="relative container-page">
        <SectionHeading
          eyebrow={t(copy.galleryEyebrow)}
          lead={t(copy.galleryLead)}
          accent={t(copy.galleryAccent)}
        />

        <RevealGroup
          as="ul"
          className="mt-14 grid auto-rows-[11rem] grid-cols-2 gap-4 sm:auto-rows-[13rem] lg:grid-cols-4"
        >
          {gallery.map((item) => (
            <RevealItem
              as="li"
              key={item.src}
              className={`group relative overflow-hidden rounded-3xl border border-bark-100 bg-white shadow-lift ${
                item.portrait ? "row-span-2" : ""
              }`}
            >
              {/* The caption is rendered by this component, not by SmartImage,
                  so a placeholder tile does not end up captioned twice. */}
              <SmartImage
                src={item.src}
                alt={t(item.alt)}
                fallbackNote={t(copy.photoComingSoon)}
                className="transition duration-500 group-hover:scale-[1.04]"
                sizes="(min-width: 1024px) 25vw, 50vw"
              />

              {/* Caption is always visible rather than hover-only: most of this
                  site's traffic is touch, where :hover never fires and a
                  hover-gated label is simply an invisible one. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bark-950/85 via-bark-950/35 to-transparent"
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-xs leading-snug font-semibold text-white">
                {t(item.caption)}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
