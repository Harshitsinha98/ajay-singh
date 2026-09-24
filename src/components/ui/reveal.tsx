/**
 * Scroll-reveal primitives — CSS-only, by design.
 *
 * The usual way to build this is a JS observer that starts each element at
 * `opacity: 0` and animates it in once it intersects the viewport. That was the
 * first implementation here, and verifying it showed the flaw: the
 * server-rendered HTML ships with every section invisible, so anything that
 * stops the JavaScript from running — a chunk dropped on a patchy connection, a
 * browser two versions too old, a crawler that does not execute scripts —
 * leaves the visitor looking at a blank page. For a site whose entire job is to
 * show a phone number and an address, that is a poor trade for a fade-in.
 *
 * So the resting state here is *visible*, and the animation is layered on top by
 * `globals.css` only where the browser supports scroll-driven timelines and the
 * reader has not asked for reduced motion. Where it is unsupported, the content
 * just appears — a perfectly good outcome. These components therefore ship no
 * client JavaScript at all; they only set the data attributes and custom
 * properties the stylesheet keys off.
 */

import type { CSSProperties, ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

/** Distance and axis the element travels in from. */
const AXIS: Record<Direction, { x: string; y: string }> = {
  up: { x: "0", y: "1.6rem" },
  down: { x: "0", y: "-1.6rem" },
  left: { x: "1.6rem", y: "0" },
  right: { x: "-1.6rem", y: "0" },
  none: { x: "0", y: "0" },
};

/**
 * A scroll-driven animation has no wall-clock delay to apply — progress is tied
 * to scroll position, not time. `delay` is kept at the call sites because it
 * reads naturally, and is converted here into a stagger step that nudges the
 * element's `animation-range` along instead.
 */
function staggerStep(delay: number): number {
  return Math.min(7, Math.max(0, Math.round(delay / 0.06)));
}

function revealVars(
  direction: Direction,
  delay: number,
  scale: boolean,
): CSSProperties {
  const { x, y } = AXIS[direction];
  return {
    "--reveal-x": x,
    "--reveal-y": y,
    "--reveal-scale": scale ? 0.96 : 1,
    "--reveal-i": staggerStep(delay),
  } as CSSProperties;
}

export function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  scale = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  /** Slight scale-up on entry — suits cards and images. */
  scale?: boolean;
  as?: "div" | "section" | "li" | "article" | "span" | "header" | "footer";
}) {
  return (
    <Tag className={className} data-reveal style={revealVars(direction, delay, scale)}>
      {children}
    </Tag>
  );
}

/**
 * Wraps a list so its children cascade in one after another. The stagger is
 * done in CSS with `nth-child`, which means no index has to be threaded through
 * JSX and the group does not need to inspect its own children.
 */
export function RevealGroup({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
}) {
  return (
    <Tag className={className} data-reveal-group>
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  return (
    <Tag className={className} data-reveal>
      {children}
    </Tag>
  );
}
