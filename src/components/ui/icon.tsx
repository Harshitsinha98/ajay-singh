"use client";

/**
 * Icon registry.
 *
 * doctor.ts refers to icons by name so the data file stays free of React
 * imports. Only the icons actually used are registered, which keeps them
 * tree-shakeable — importing the whole lucide barrel would drag hundreds of
 * components into the client bundle.
 */

import {
  Activity,
  Bone,
  Briefcase,
  Building2,
  CalendarCheck,
  Droplet,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  Languages,
  Leaf,
  Pill,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  activity: Activity,
  bone: Bone,
  briefcase: Briefcase,
  building: Building2,
  "calendar-check": CalendarCheck,
  droplet: Droplet,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  "indian-rupee": IndianRupee,
  languages: Languages,
  leaf: Leaf,
  pill: Pill,
  "shield-check": ShieldCheck,
  stethoscope: Stethoscope,
  thermometer: Thermometer,
  wind: Wind,
};

export function Icon({
  name,
  className,
  strokeWidth = 1.6,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Component = REGISTRY[name] ?? Stethoscope;
  return <Component className={className} strokeWidth={strokeWidth} aria-hidden />;
}
