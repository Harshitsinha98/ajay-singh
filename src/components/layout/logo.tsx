/**
 * Wordmark and monogram.
 *
 * Dr. Pundir is an Ayurvedacharya practising general medicine, and the mark
 * tries to hold both halves of that: a leaf silhouette (Ayurveda) with a pulse
 * trace running through it (clinical practice). A plain red cross or a caduceus
 * would say "hospital", which this single-doctor clinic is not.
 */

export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-vaidya-500 via-vaidya-600 to-bark-800 text-white shadow-[0_6px_20px_-6px_rgba(21,129,83,0.6)] ${className}`}
    >
      {/* Sheen sweep — a subtle sign of life on an otherwise static mark. */}
      <span
        aria-hidden
        className="absolute inset-y-0 w-1/2 animate-sheen bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="relative size-[66%]">
        {/*
         * A solid leaf rather than an outlined one: at 40px a 1.5px stroke
         * collapses into mush, whereas a filled silhouette stays crisp.
         * The shape is the classic two-arc lens, long axis running bottom-left
         * to top-right.
         */}
        <path
          d="M4 20C4 11.16 11.16 4 20 4C20 12.84 12.84 20 4 20Z"
          fill="currentColor"
        />
        {/*
         * The leaf's midrib *is* a pulse trace — the one idea in this mark.
         * It is drawn horizontally and rotated onto the leaf's diagonal axis,
         * which is far easier to keep symmetrical than hand-computing a
         * rotated zigzag.
         */}
        <g transform="rotate(-45 12 12)">
          <path
            d="M4.6 12h3.4l1-2 1.4 4 1.3-2.6.9.6h6.8"
            stroke="var(--color-vaidya-800)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  );
}

export function LogoWordmark({
  nameHi,
  nameEn,
  sub,
  tone = "light",
}: {
  nameHi: string;
  nameEn: string;
  sub: string;
  tone?: "light" | "dark";
}) {
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span
        className={`truncate text-[0.95rem] font-extrabold tracking-tight sm:text-[1.05rem] ${
          tone === "dark" ? "text-white" : "text-bark-950"
        }`}
      >
        {nameHi}
      </span>
      <span
        className={`mt-1 truncate text-[0.62rem] font-semibold tracking-[0.14em] uppercase ${
          tone === "dark" ? "text-vaidya-200/85" : "text-vaidya-700/85"
        }`}
      >
        {nameEn}
      </span>
      <span
        className={`mt-0.5 hidden truncate text-[0.66rem] font-medium sm:block ${
          tone === "dark" ? "text-bark-300" : "text-bark-500"
        }`}
      >
        {sub}
      </span>
    </span>
  );
}
