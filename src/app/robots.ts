import type { MetadataRoute } from "next";
import { doctor } from "@/lib/doctor";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${doctor.siteUrl}/sitemap.xml`,
    host: doctor.siteUrl,
  };
}
