import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { CancelForm } from "@/components/booking/cancel-form";
import { contact, doctor, telHref } from "@/lib/doctor";

export const metadata: Metadata = {
  title: "Book a token",
  description: `Book an OPD token with ${doctor.name.en}, general physician in Haldwani. Choose a day and time and get your token number instantly.`,
  // A booking form has nothing to offer a search engine, and indexing it would
  // compete with the home page for the clinic's own name.
  robots: { index: false, follow: true },
};

export default function BookPage() {
  return (
    <div className="relative min-h-screen bg-bark-50 pt-28 pb-20 sm:pt-32">
      <div aria-hidden className="absolute inset-0 bg-grid-light opacity-60" />

      <div className="relative container-page">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-bark-500 transition hover:text-vaidya-700"
        >
          <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden />
          {doctor.shortName.en}
        </Link>

        <div className="mx-auto mt-6 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-vaidya-50 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-vaidya-700 uppercase ring-1 ring-vaidya-100">
            <span className="size-1.5 rounded-full bg-vaidya-500" />
            Online token · ऑनलाइन टोकन
          </span>
          <h1 className="mt-5 text-3xl leading-tight font-extrabold text-bark-950 sm:text-4xl">
            Book a token · टोकन बुक करें
          </h1>
          <p className="mt-4 text-base leading-relaxed text-bark-600">
            Pick a day and a time, give the patient&rsquo;s name and mobile number, and
            you will get a token number straight away.
            <span className="mt-1 block">
              दिन और समय चुनें, मरीज़ का नाम और मोबाइल नंबर दें — टोकन नंबर तुरंत मिल
              जाएगा।
            </span>
          </p>
        </div>

        <div className="mt-12">
          <BookingWizard />
        </div>

        {/* ---------- cancel ---------- */}
        <section className="mx-auto mt-12 max-w-3xl rounded-3xl border border-bark-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-bark-950">
            Cancel a token · टोकन रद्द करें
          </h2>
          <p className="mt-1.5 text-sm text-bark-600">
            Enter the booking code and the mobile number it was booked with. Cancelling
            frees the slot for another patient.
            <span className="mt-1 block">
              बुकिंग कोड और मोबाइल नंबर दर्ज करें। रद्द करने से वह समय दूसरे मरीज़ के लिए
              खाली हो जाता है।
            </span>
          </p>
          <div className="mt-5">
            <CancelForm />
          </div>
        </section>

        {/* ---------- phone fallback ---------- */}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <p className="text-sm text-bark-600">
            Trouble booking online? Just call the clinic. · ऑनलाइन दिक्कत हो रही है?
            सीधे कॉल करें।
          </p>
          <a
            href={telHref()}
            className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-vaidya-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-vaidya-700"
          >
            <Phone className="size-4" strokeWidth={2.3} aria-hidden />
            {contact.phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
