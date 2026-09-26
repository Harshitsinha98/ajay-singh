# Dr. Ajay Pratap Singh Pundir — clinic website

A bilingual (हिन्दी / English) site for **Dr. Ajay Pratap Singh Pundir (डॉ. अजय पुंडीर)**,
B.A.M.S., general physician at Sarvodaya Vihar, Haldwani.

Two halves:

- **The public page** (`/`) — profile, council registration, what he treats, hospitals
  served, clinic terms, community recognition, gallery, contact. Prerenders to static HTML.
- **An OPD token system** (`/book`, `/admin`) — patients book a numbered token for a
  specific time; the counter works down the day's register.

Built with Next.js (App Router), Tailwind CSS v4 and SQLite.

## Running it

```bash
npm install
cp .env.example .env.local     # set ADMIN_PASSCODE
npm run dev                    # http://localhost:3000
npm test                       # booking engine test suite
npm run build                  # production build
npm run lint                   # tsc --noEmit
```

Tokens are stored in `./data/clinic.db` locally. Nothing else to install — no separate
backend process, no Docker, no migration step.

---

# The token system

## How it works

There is **no separate backend**. The API lives in the same Next.js app as
route handlers under `src/app/api/`, which become serverless functions when
deployed. "Running the backend" is just running the app.

| Route | Purpose |
| --- | --- |
| `GET /api/availability` | The day's slot grid + the list of bookable dates |
| `POST /api/appointments` | Book a token |
| `GET /api/appointments` | Look one up (needs code **and** mobile number) |
| `POST /api/appointments/cancel` | Cancel (needs code **and** mobile number) |
| `GET /api/admin/appointments` | The day's register — passcode required |
| `PATCH /api/admin/appointments` | Mark seen / no-show / cancel |

Tokens are **positional, not first-come-numbered**. Token *N* is always the *N*th slot of
the doctor's day, so the number tells the patient when to arrive and the queue is always
in clock order.

### Why it cannot double-book

The database carries a partial UNIQUE index on `(doctor_id, date, slot_index)` for
slot-holding statuses. Two patients holding one slot is not prevented by careful
application code — it is **structurally impossible**. If two requests race through the
availability check at the same instant, one simply fails at INSERT time and is told the
slot just went.

Every write is a single atomic statement, so no transaction is ever held open across a
network round trip — which matters when the database is reached over HTTP.

This is verified rather than asserted: `npm test` spawns 20 separate OS processes that all
fight for the same slot and asserts exactly one wins, then 30 processes auto-booking at
once and asserts 30 distinct tokens. (Separate processes, not `Promise.all` — parallel
promises in one event loop interleave politely at await boundaries and would pass even
with no protection at all.)

## Where the backend runs

Two storage options. Which one you need depends entirely on **where you deploy**.

### Local development, or a VPS with a real disk

Nothing to configure. A SQLite file appears at `./data/clinic.db`.

### Vercel (or any serverless host) — Turso is required

Vercel's filesystem is read-only and wiped between requests, so a SQLite **file** cannot
work there. Instead of silently losing bookings, the app detects this and refuses to take
them, telling patients to phone the clinic. Handing someone a real-looking token number
that quietly evaporates is worse than an honest "please call".

So on Vercel you need [Turso](https://turso.tech) — hosted SQLite over HTTP, whose free
tier is far more than one clinic will use:

```bash
turso db create ajay-pundir-clinic
turso db show   ajay-pundir-clinic --url
turso db tokens create ajay-pundir-clinic
```

Then in **Vercel → Settings → Environment Variables** add:

| Variable | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://ajay-pundir-clinic-….turso.io` |
| `TURSO_AUTH_TOKEN` | the token from the command above |
| `ADMIN_PASSCODE` | a long passcode for the counter |

Setting `TURSO_DATABASE_URL` switches storage automatically — there is no other flag. The
schema is created on first connection, so **there is no migration to run**. Redeploy and
booking is live.

The `/admin` screen shows which backend is in use, so staff can confirm at a glance that
bookings are durable.

## The front desk — `/admin`

Open `/admin`, enter `ADMIN_PASSCODE`, and you get the day's register: token number, time,
patient, mobile, complaint, and one-tap buttons for **seen**, **no-show** and **cancel**.
Cancelling releases the slot back into the pool.

The passcode is held in `sessionStorage`, so it dies with the tab — a counter machine left
logged in overnight is a realistic risk. It is a single shared passcode, not user accounts;
see the note in `src/lib/admin-auth.ts` for when that would need upgrading.

`/admin`, `/book` and `/api/` are all excluded in `robots.txt`.

## No WhatsApp credentials needed

The system this was ported from sent confirmations through the WhatsApp Cloud API, which
needs a Meta Business account and an approved template. That is disproportionate here, so
the success screen instead gives the patient a prefilled `wa.me` link they tap to send the
token to themselves. Zero credentials, zero webhook, and the token still ends up in their
chat history.

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

## 🔴 Confirm the sitting hours before advertising the booking page

**This is now the most important open item, and it became more important the moment the
token system was added.** A token *is* a time — the system cannot exist without hours, so
the hours in `src/lib/schedule.ts` are currently a **guess**:

```ts
morning  10:00 – 13:00   (Sun–Fri, 10-minute slots)
evening  18:00 – 20:00   (Sun–Fri, 10-minute slots)
Saturday closed          ← this part IS confirmed, from the notice board
```

Nothing in the source photographs stated the daily hours. Rather than refuse to build the
feature, the guess is flagged as one: while `SCHEDULE_CONFIRMED` is `false`,

- the booking page shows an unmissable banner telling patients the timings are provisional
  and to ring before travelling,
- the same warning is repeated on the token confirmation screen,
- `/admin` shows a standing reminder to the counter staff,
- and the public page still publishes **no** opening hours in its structured data, so
  Google cannot tell anyone the clinic is open when it is not.

Token numbers and queue order are correct regardless — it is only the wall-clock times
that are unverified.

**To fix:** correct `sessions` in `src/lib/schedule.ts`, set
`export const SCHEDULE_CONFIRMED = true`, redeploy. Every warning disappears on its own.
Adjust `slotMinutes` too if the doctor sees patients faster or slower than one per ten
minutes, since that sets how many tokens a day holds (currently 30).

Also in that file: `blackoutDates` for festivals and leave, and `BOOKING_WINDOW_DAYS`
(currently 14) for how far ahead patients may book.

## ⚠️ Also worth confirming

**Email address.** The handwritten note abbreviated the domain, so `contact.email` in
`doctor.ts` is a best reading — `ajaypratapsinghpundir76@gmail.com`. Please verify it; a
bounced email is a silently lost patient. (`contact.emailConfirmed` is `false` as a
reminder.)

What *is* confirmed, straight from the notice board and published as fact: consultation fee
₹50, one slip valid 5 days, and closed on Saturday.

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

Booking, in order of importance:

1. Confirm the sitting hours and set `SCHEDULE_CONFIRMED = true` (see above).
2. Set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` if deploying to Vercel — **without these
   the booking page will correctly refuse to take bookings.**
3. Set `ADMIN_PASSCODE` to something long. `/admin` returns 503 until it is set.
4. Book one real token end to end and mark it seen on `/admin`.

Everything else:

- Point `doctor.siteUrl` in `doctor.ts` at the real domain (currently
  `https://drajaypundir.in`). It feeds canonical URLs, `robots.txt`, the sitemap and the
  structured data.
- Add the photographs (table above), a favicon and an Open Graph image.
- Confirm the email address.
- Confirm the Google Maps location. `contact.mapsQuery` is a *search* for the colony
  rather than a dropped pin, because the exact coordinates of the consulting room were
  not in the source material and a pin 300 m out is worse than a search that lands on the
  right street.

## Layout of the code

```
src/lib/
  doctor.ts      every published fact about the practice
  copy.ts        bilingual interface labels
  schedule.ts    sitting hours → numbered slots   ⚠️ hours are provisional
  booking.ts     the booking engine
  db.ts          storage: SQLite file or Turso, one interface
  time.ts        IST arithmetic (fixed +05:30, no DST)
  patient.ts     phone normalisation, duplicate keys — no DB import, so it is
                 safe to use from client components
  admin-auth.ts  counter passcode, constant-time compare
  api-guard.ts   one shared "storage is down, please call" response
  rate-limit.ts  in-memory fixed-window limiter

src/app/api/     the backend — route handlers, no separate server
src/app/book/    patient-facing booking page
src/app/admin/   front-desk register
scripts/         test suite, incl. the multi-process race test
```
