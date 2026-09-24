# Dr. Ajay Pratap Singh Pundir — clinic website

A single-page, bilingual (हिन्दी / English) information site for **Dr. Ajay Pratap Singh Pundir
(डॉ. अजय पुंडीर)**, B.A.M.S., general physician at Sarvodaya Vihar, Haldwani.

It is deliberately an *information* site: no booking engine, no database, no login, no
API routes. The practice is one doctor with a counter and a slip book, and a form that
silently goes nowhere would be worse than no form. Every visitor action is a phone call,
a WhatsApp message, or directions.

Built with Next.js (App Router) and Tailwind CSS v4. The whole site prerenders to static
HTML.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint    # tsc --noEmit
```

## Where the content lives

Everything factual is in **`src/lib/doctor.ts`** — name, qualification, registration,
address, phone, fee, hospitals served, awards, and the gallery manifest. Nothing is
hardcoded in a component. `src/lib/copy.ts` holds only interface chrome (button labels,
headings) in both languages.

To change a fact, edit `doctor.ts`. To change a label, edit `copy.ts`.

### Provenance

The content was transcribed from photographs supplied by the clinic: the Uttarakhand
Bhartiya Chikitsa Parishad registration certificate (क्रमांक 8507, निबन्धन संख्या UK 1977),
a handwritten profile note, the consulting-room notice board, two framed citations from
सौहार्द जन सेवा समिति, and a Dainik Jagran clipping about a Teachers' Day health camp.

## ⚠️ Two things to confirm before publishing

1. **Email address.** The handwritten note abbreviated the domain, so
   `contact.email` in `doctor.ts` is a best reading —
   `ajaypratapsinghpundir76@gmail.com`. Please verify it; a bounced email is a
   silently lost patient. (`contact.emailConfirmed` is set to `false` as a reminder.)

2. **Daily consultation hours.** These were not on the notice board or in the profile
   note, so the site does **not** state them. The Timings card currently says the hours
   vary with hospital duty and offers a call button, and no opening hours are published
   in the page's structured data — so Google cannot tell anyone the clinic is open when
   it is not.

   To publish real hours, fill in `consultation.hours` in `doctor.ts`:

   ```ts
   hours: {
     confirmed: true,
     sessions: [
       { label: { en: "Morning", hi: "सुबह" }, time: { en: "9:00 am – 11:00 am", hi: "9:00 – 11:00" } },
       { label: { en: "Evening", hi: "शाम" },  time: { en: "6:00 pm – 8:00 pm",  hi: "6:00 – 8:00" } },
     ],
     // ...
   }
   ```

   The card switches to a proper timings table automatically.

What *is* published, straight from the notice board: consultation fee ₹50, one slip valid
5 days, and closed on Saturday.

## Adding the photographs

Image paths are already wired up. Until a file exists, `<SmartImage>` renders a designed
placeholder tile with its caption, so the layout never breaks and nothing looks
half-finished. Drop the photos in at these exact paths:

| Path under `public/` | Photograph |
| --- | --- |
| `images/doctor/dr-ajay-pundir.jpg` | Portrait for the hero (best: the one at the desk, portrait crop) |
| `images/clinic/consulting-room.jpg` | Consulting room, doctor at the desk |
| `images/clinic/consultation.jpg` | Doctor speaking with a patient |
| `images/clinic/clinic-desk.jpg` | Clinic desk / wider room shot |
| `images/credentials/registration-certificate.jpg` | The निबन्धन प्रमाण-पत्र |
| `images/recognition/samman-patra-2020.jpg` | सम्मान पत्र, 31 October 2020 |
| `images/recognition/prashasti-patra-2025.jpg` | प्रशस्ति पत्र, 26 July 2025 |
| `images/recognition/dainik-jagran-camp.jpg` | The Dainik Jagran clipping |

The hero portrait wants a roughly 4:5 crop. Gallery tiles are cropped to fit, and the
two marked `portrait: true` in `doctor.ts` get a taller tile so a certificate's text is
not cut off.

## A note on the animations

Section entrances are **CSS-only**, using a scroll-driven `animation-timeline: view()`
and no JavaScript (see `src/components/ui/reveal.tsx`). The first implementation used a
JS observer, and testing showed the flaw: the server-rendered HTML shipped with every
section at `opacity: 0`, so a dropped script on a patchy connection meant a completely
blank page.

Now the resting state is *visible* and the animation is pure enhancement. Browsers
without scroll-driven timeline support, and readers with `prefers-reduced-motion`, simply
get the content with no animation.

## Before going live

- Point `doctor.siteUrl` in `doctor.ts` at the real domain (currently
  `https://drajaypundir.in`). It feeds canonical URLs, `robots.txt`, the sitemap and the
  structured data.
- Add a favicon and an Open Graph image.
- Confirm the Google Maps location. `contact.mapsQuery` is a *search* for the colony
  rather than a dropped pin, because the exact coordinates of the consulting room were
  not in the source material and a pin 300 m out is worse than a search that lands on the
  right street.
