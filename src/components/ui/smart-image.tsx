"use client";

/**
 * Image that degrades into a designed placeholder instead of a broken icon.
 *
 * The clinic's photographs are being collected gradually, so several paths in
 * doctor.ts will 404 until the files are dropped into /public. Rather than let
 * that show, a missing file falls back to a tinted tile carrying the caption and
 * a short note — the layout stays intact and nothing looks half-built.
 */

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

/** Deterministic tint per path, so a given photo always gets the same tile. */
const TINTS = [
  "from-vaidya-100 via-vaidya-50 to-saffron-50",
  "from-saffron-100 via-vaidya-50 to-vaidya-100",
  "from-vaidya-50 via-saffron-50 to-saffron-100",
  "from-bark-100 via-vaidya-50 to-vaidya-100",
];

function tintFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

export function SmartImage({
  src,
  alt,
  caption,
  fallbackNote,
  className = "",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  fill = true,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  fallbackNote?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`relative flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br p-6 text-center ${tintFor(
          src,
        )} ${className}`}
      >
        <span className="flex size-11 items-center justify-center rounded-2xl bg-white/70 text-vaidya-600 shadow-sm ring-1 ring-white/60">
          <ImageIcon className="size-5" strokeWidth={1.6} aria-hidden />
        </span>
        {caption && (
          <span className="text-sm font-semibold text-bark-800">{caption}</span>
        )}
        {fallbackNote && <span className="text-xs text-bark-500">{fallbackNote}</span>}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...(fill ? { fill: true } : { width: width ?? 800, height: height ?? 600 })}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
