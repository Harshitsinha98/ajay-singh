import type { MetadataRoute } from "next";
import { doctor } from "@/lib/doctor";

/**
 * One page, one entry. Anchors within it are not listed — Google treats
 * `#about` as the same URL, and padding a sitemap with fragments is noise.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: doctor.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
