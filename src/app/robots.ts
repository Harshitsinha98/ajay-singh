import type { MetadataRoute } from "next";
import { doctor } from "@/lib/doctor";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        /**
         * The booking form and the counter register have nothing to offer a
         * search engine. Excluding them also stops a crawler from hammering
         * /api/availability on every slot render, and keeps /book from competing
         * with the home page for the clinic's own name.
         */
        disallow: ["/book", "/admin", "/api/"],
      },
    ],
    sitemap: `${doctor.siteUrl}/sitemap.xml`,
    host: doctor.siteUrl,
  };
}
