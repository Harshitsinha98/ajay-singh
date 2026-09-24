"use client";

/**
 * Ambient background layers.
 *
 * `Aurora` renders slow-drifting blurred colour fields. They are purely
 * decorative, so the wrapper is aria-hidden and pointer-events-none, and the
 * drift is a plain CSS keyframe — the reduced-motion block in globals.css
 * switches it off with no JS involvement.
 */

export function Aurora({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const orbs =
    variant === "dark"
      ? [
          "bg-vaidya-500/25 -top-40 -left-32 h-[30rem] w-[30rem] animate-drift-slow",
          "bg-saffron-400/15 top-1/3 -right-40 h-[26rem] w-[26rem] animate-drift",
          "bg-vaidya-300/15 -bottom-48 left-1/4 h-[28rem] w-[28rem] animate-drift-slow",
        ]
      : [
          "bg-vaidya-300/35 -top-32 -left-24 h-[24rem] w-[24rem] animate-drift-slow",
          "bg-saffron-200/45 top-1/2 -right-32 h-[22rem] w-[22rem] animate-drift",
          "bg-vaidya-200/45 -bottom-32 left-1/3 h-[20rem] w-[20rem] animate-drift-slow",
        ];

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {orbs.map((orb, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-3xl will-change-transform ${orb}`}
          // Staggered so the three orbs never move in lockstep.
          style={{ animationDelay: `${i * -6}s` }}
        />
      ))}
    </div>
  );
}

/**
 * A thin ECG trace drawn across the container. Decorative only; it sits behind
 * the hero content and is faded at both ends so it never competes with text.
 */
export function EcgLine({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute ${className}`}
    >
      <defs>
        <linearGradient id="ecg-fade" x1="0" x2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="18%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="82%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 60 H180 l18 0 l10 -34 l12 66 l12 -46 l10 14 H420 l20 0 l10 -28 l12 56 l12 -40 l10 12 H700 l18 0 l10 -34 l12 66 l12 -46 l10 14 H1200"
        fill="none"
        stroke="url(#ecg-fade)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
