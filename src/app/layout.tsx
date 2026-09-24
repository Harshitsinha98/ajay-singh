import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/components/i18n/language-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileActionBar } from "@/components/layout/mobile-action-bar";
import {
  consultation,
  contact,
  doctor,
  expertise,
  registration,
} from "@/lib/doctor";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

/**
 * A large share of visitors will read the Hindi copy, so the Devanagari face is
 * loaded rather than left to a system fallback — Devanagari system fonts vary
 * wildly across Android versions and several render the conjuncts poorly.
 */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const title =
  "Dr. Ajay Pratap Singh Pundir (B.A.M.S.) | General Physician in Haldwani, Nainital";
const description =
  "Dr. Ajay Pratap Singh Pundir (डॉ. अजय पुंडीर), B.A.M.S., general physician at Sarvodaya Vihar Phase-II, Badi Mukhani, Haldwani. 25 years of hospital and clinical practice, Uttarakhand registration UK 1977. Consultation ₹50; slip valid 5 days; closed Saturday.";

export const metadata: Metadata = {
  metadataBase: new URL(doctor.siteUrl),
  title: {
    default: title,
    template: `%s | ${doctor.shortName.en}`,
  },
  description,
  applicationName: doctor.shortName.en,
  keywords: [
    "Dr. Ajay Pratap Singh Pundir",
    "डॉ. अजय प्रताप सिंह पुंडीर",
    "Dr. Ajay Pundir Haldwani",
    "डॉ. अजय पुंडीर हल्द्वानी",
    "general physician Haldwani",
    "BAMS doctor Haldwani",
    "doctor in Sarvodaya Vihar Haldwani",
    "Badi Mukhani doctor",
    "Pilikothi Haldwani clinic",
    "physician Nainital",
    "BP diabetes doctor Haldwani",
    "आयुर्वेदिक डॉक्टर हल्द्वानी",
  ],
  authors: [{ name: doctor.name.en }],
  alternates: {
    canonical: "/",
    languages: { "hi-IN": "/", "en-IN": "/" },
  },
  openGraph: {
    type: "website",
    locale: "hi_IN",
    alternateLocale: ["en_IN"],
    url: doctor.siteUrl,
    siteName: doctor.shortName.en,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "health",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b170f" },
    { media: "(prefers-color-scheme: dark)", color: "#0b170f" },
  ],
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom: older patients routinely rely on it to read.
  maximumScale: 5,
};

/**
 * Structured data for Google's local pack and knowledge panel.
 *
 * Note what is *absent*: no `openingHoursSpecification`, because the daily
 * sitting hours are not confirmed. Publishing invented hours in schema is how a
 * patient ends up outside a locked door with Google insisting it is open.
 */
function structuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Physician",
        "@id": `${doctor.siteUrl}/#physician`,
        name: doctor.name.en,
        alternateName: [doctor.name.hi, doctor.shortName.en, doctor.shortName.hi],
        description,
        url: doctor.siteUrl,
        telephone: `+${contact.phone}`,
        email: contact.email,
        medicalSpecialty: "PrimaryCare",
        availableService: expertise.map((item) => ({
          "@type": "MedicalProcedure",
          name: item.title.en,
        })),
        address: {
          "@type": "PostalAddress",
          streetAddress:
            "House No. 184, Sarvodaya Vihar Phase-II, Badi Mukhani, Pilikothi",
          addressLocality: "Haldwani",
          addressRegion: "Uttarakhand",
          postalCode: "263139",
          addressCountry: "IN",
        },
        areaServed: [
          { "@type": "Place", name: "Haldwani" },
          { "@type": "Place", name: "Badi Mukhani" },
          { "@type": "Place", name: "Nainital" },
          { "@type": "Place", name: "Kathgodam" },
        ],
        hasCredential: [
          {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "degree",
            name: "Bachelor of Ayurvedic Medicine and Surgery (B.A.M.S.)",
            recognizedBy: {
              "@type": "CollegeOrUniversity",
              name: doctor.university.en,
            },
          },
          {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: "license",
            identifier: registration.number,
            recognizedBy: {
              "@type": "Organization",
              name: registration.council.en,
            },
          },
        ],
        knowsLanguage: ["hi", "en"],
        priceRange: `₹${consultation.fee}`,
      },
    ],
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /**
     * The font variable classes must live on <html>, not <body>. globals.css
     * declares `--font-sans: var(--font-jakarta), …` on :root, and a custom
     * property is substituted against the element it is declared on — so with
     * the classes on <body>, `--font-jakarta` would be undefined at :root, the
     * whole declaration would be invalid, and every Devanagari glyph would fall
     * back to tofu boxes.
     */
    <html
      lang="hi"
      className={`${jakarta.variable} ${devanagari.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          // A literal object we control — no user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
        <LanguageProvider>
          <Header />
          <main id="main" className="pb-20 sm:pb-0">
            {children}
          </main>
          <Footer />
          <MobileActionBar />
        </LanguageProvider>
      </body>
    </html>
  );
}
