"use client";

import type { ReactNode } from "react";
import { Reveal } from "./reveal";

/**
 * Shared section header: small eyebrow label, two-tone heading, optional intro.
 * Centralised so every section shares the same vertical rhythm.
 */
export function SectionHeading({
  eyebrow,
  lead,
  accent,
  intro,
  align = "center",
  tone = "light",
  accentTone = "cool",
  children,
}: {
  eyebrow: string;
  lead: string;
  accent: string;
  intro?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
  accentTone?: "cool" | "warm";
  children?: ReactNode;
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left"}>
      <Reveal direction="up">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] uppercase ${
            tone === "dark"
              ? "bg-white/10 text-vaidya-200 ring-1 ring-white/15"
              : "bg-vaidya-50 text-vaidya-700 ring-1 ring-vaidya-100"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              tone === "dark" ? "bg-vaidya-300" : "bg-vaidya-500"
            }`}
          />
          {eyebrow}
        </span>
      </Reveal>

      <Reveal direction="up" delay={0.08}>
        <h2
          className={`mt-5 text-3xl leading-[1.15] sm:text-4xl lg:text-[2.6rem] ${
            tone === "dark" ? "text-white" : "text-bark-950"
          }`}
        >
          {lead}{" "}
          <span className={accentTone === "warm" ? "text-gradient-warm" : "text-gradient"}>
            {accent}
          </span>
        </h2>
      </Reveal>

      {intro && (
        <Reveal direction="up" delay={0.14}>
          <p
            className={`mt-5 text-base leading-relaxed sm:text-lg ${
              tone === "dark" ? "text-bark-200" : "text-bark-600"
            } ${centered ? "mx-auto" : ""}`}
          >
            {intro}
          </p>
        </Reveal>
      )}

      {children}
    </div>
  );
}
