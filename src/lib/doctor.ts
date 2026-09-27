/**
 * Single source of truth for every fact shown on this site.
 *
 * Provenance matters here, so it is recorded inline. Everything below was
 * transcribed from photographs supplied by the clinic:
 *
 *   • the Uttarakhand Ayurvedic & Unani board registration certificate
 *     (निबन्धन प्रमाण-पत्र, क्रमांक 8507)
 *   • the handwritten profile note listing address, phone, and past posts
 *   • the notice board in the consulting room (fee, prescription validity,
 *     weekly closing day)
 *   • two framed citations from सौहार्द जन सेवा समिति
 *   • a Dainik Jagran clipping about a Teachers' Day health camp
 *
 * Anything not evidenced by those sources is marked `confirmed: false` and the
 * UI degrades gracefully rather than inventing a detail. Please do not "fill in"
 * a plausible-looking value — for a medical practice a wrong timing or fee is
 * worse than an absent one.
 */

export type Bilingual = { en: string; hi: string };

const t = (en: string, hi: string): Bilingual => ({ en, hi });

/* ================================================================== */
/* Identity                                                            */
/* ================================================================== */

export const doctor = {
  name: t("Dr. Ajay Pratap Singh Pundir", "डॉ. अजय प्रताप सिंह पुंडीर"),
  /** How patients and the local press actually refer to him. */
  shortName: t("Dr. Ajay Pundir", "डॉ. अजय पुंडीर"),
  qualification: t("B.A.M.S. (Ayurvedacharya)", "बी.ए.एम.एस. (आयुर्वेदाचार्य)"),
  role: t("General Physician", "जनरल फिजिशियन"),
  currentPost: t("Medical Superintendent", "मेडिकल सुपरिंटेंडेंट"),
  university: t(
    "Chhatrapati Shahu Ji Maharaj University, Kanpur",
    "छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर",
  ),
  yearsOfExperience: 25,
  /** From the registration certificate: निबन्धन तिथि 28.07.2010. */
  registeredSince: "2010",
  siteUrl: "https://drajaypundir.in",

  tagline: t(
    "General physician in Haldwani · 25 years of practice",
    "हल्द्वानी में जनरल फिजिशियन · 25 वर्षों का अनुभव",
  ),

  /**
   * Two short paragraphs rather than one long one — this is the block people
   * actually read, and on a phone a wall of text simply gets skipped.
   */
  bio: [
    t(
      "Dr. Ajay Pratap Singh Pundir is a general physician based in Haldwani, Nainital. He completed his B.A.M.S. (Ayurvedacharya) from Chhatrapati Shahu Ji Maharaj University, Kanpur, and has been on the state register of the Bhartiya Chikitsa Parishad, Uttarakhand since 2010.",
      "डॉ. अजय प्रताप सिंह पुंडीर हल्द्वानी, नैनीताल के जनरल फिजिशियन हैं। उन्होंने छत्रपति शाहू जी महाराज विश्वविद्यालय, कानपुर से बी.ए.एम.एस. (आयुर्वेदाचार्य) किया है और वर्ष 2010 से भारतीय चिकित्सा परिषद, उत्तराखण्ड के राज्य रजिस्टर में पंजीकृत हैं।",
    ),
    t(
      "Across 25 years he has worked at several of Haldwani's best-known hospitals — Krishna Hospital & Research Centre, Neelkanth Hospital and Sanjeevani Hospital among them — and today serves as a Medical Superintendent. Alongside hospital duties he runs a consulting room at Sarvodaya Vihar and has given free consultations at community health camps in and around the city for several years.",
      "25 वर्षों में उन्होंने हल्द्वानी के कई प्रमुख अस्पतालों में सेवा दी है — कृष्णा हॉस्पिटल एंड रिसर्च सेंटर, नीलकंठ हॉस्पिटल और संजीवनी हॉस्पिटल सहित — और वर्तमान में मेडिकल सुपरिंटेंडेंट के पद पर कार्यरत हैं। अस्पताल की ज़िम्मेदारियों के साथ-साथ वे सर्वोदय विहार में अपना परामर्श कक्ष चलाते हैं और कई वर्षों से शहर व आसपास के निःशुल्क स्वास्थ्य शिविरों में परामर्श देते आ रहे हैं।",
    ),
  ],
};

/* ================================================================== */
/* Contact                                                             */
/* ================================================================== */

export const contact = {
  /** E.164 without the '+' — used to build tel: and wa.me links. */
  phone: "917017428128",
  phoneDisplay: "+91 70174 28128",
  /**
   * The handwritten note abbreviates the domain, so this is the one field
   * transcribed with some uncertainty. Worth confirming before the site is
   * advertised — a bounced email is a silently lost patient.
   */
  email: "ajaypratapsinghpundir76@gmail.com",
  emailConfirmed: false,

  clinicName: t("Dr. Ajay Pundir's Clinic", "डॉ. अजय पुंडीर क्लीनिक"),
  addressLines: [
    t("House No. 184, Sarvodaya Vihar Phase-II", "मकान नं. 184, सर्वोदय विहार फेज़-II"),
    t("Badi Mukhani, Pilikothi", "बड़ी मुखानी, पीलीकोठी"),
    t("Haldwani, Dist. Nainital", "हल्द्वानी, जिला नैनीताल"),
    t("Uttarakhand 263139", "उत्तराखण्ड 263139"),
  ],
  locality: t("Sarvodaya Vihar, Haldwani", "सर्वोदय विहार, हल्द्वानी"),
  /**
   * A search query rather than a lat/long pin. The exact coordinates of the
   * consulting room are not in any of the source photographs, and a pin that is
   * 300m wrong is worse than a search that lands on the right colony.
   */
  mapsQuery: "Sarvodaya Vihar Phase 2, Badi Mukhani, Pilikothi, Haldwani, Uttarakhand 263139",
};

export function telHref(phone: string = contact.phone) {
  return `tel:+${phone}`;
}

export function whatsappHref(message?: string) {
  const base = `https://wa.me/${contact.phone}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function mapsHref() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    contact.mapsQuery,
  )}`;
}

export function mailtoHref() {
  return `mailto:${contact.email}`;
}

/* ================================================================== */
/* Consultation terms — straight off the notice board                  */
/* ================================================================== */

export const consultation = {
  fee: 50,
  feeNote: t("Consultation fee ₹50 only", "परामर्श शुल्क ₹50 मात्र"),
  /** पर्चा 5 दिन के लिए मान्य */
  prescriptionValidDays: 5,
  /** शनिवार (अवकाश) */
  weeklyOff: t("Saturday", "शनिवार"),

  notes: [
    t(
      "Please get your slip made at the counter before the consultation.",
      "कृपया परामर्श के लिए काउंटर से पर्चा बनवाएँ।",
    ),
    t(
      "Consultation fee is ₹50 only.",
      "परामर्श शुल्क ₹50 मात्र है।",
    ),
    t(
      "One slip stays valid for 5 days, so a follow-up within that window needs no new fee.",
      "एक पर्चा 5 दिन तक मान्य रहता है, इसलिए इस अवधि में दोबारा दिखाने पर नया शुल्क नहीं लगता।",
    ),
    t(
      "The clinic remains closed on Saturday.",
      "शनिवार को क्लीनिक बंद रहता है।",
    ),
  ],

  /**
   * Daily sitting hours are genuinely not recorded on the notice board or in
   * the profile note, so they are not asserted here. Set `confirmed: true` and
   * fill `sessions` once the clinic confirms them; until then every timing
   * surface on the site tells the visitor to ring and check, which is the
   * truthful answer.
   */
  hours: {
    confirmed: false,
    sessions: [] as Array<{ label: Bilingual; time: Bilingual }>,
    unconfirmedNote: t(
      "Daily sitting hours change with hospital duty. Please call before you travel — the number is answered on WhatsApp too.",
      "प्रतिदिन बैठने का समय अस्पताल की ड्यूटी के अनुसार बदलता है। आने से पहले कृपया कॉल करके पुष्टि कर लें — यही नंबर व्हाट्सएप पर भी उपलब्ध है।",
    ),
  },
};

/* ================================================================== */
/* Credentials                                                         */
/* ================================================================== */

export const registration = {
  council: t(
    "Bhartiya Chikitsa Parishad, Uttarakhand",
    "भारतीय चिकित्सा परिषद, उत्तराखण्ड",
  ),
  councilCity: t("Dehradun – 248001", "देहरादून – 248001"),
  number: "UK 1977",
  serial: "8507",
  registeredOn: t("28 July 2010", "28 जुलाई 2010"),
  validTill: t("23 August 2036", "23 अगस्त 2036"),
  qualificationOnCertificate: t(
    "Ayurvedacharya (B.A.M.S.)",
    "आयुर्वेदाचार्य (बी.ए.एम.एस.)",
  ),
};

export const credentials: Array<{
  icon: string;
  label: Bilingual;
  value: Bilingual;
}> = [
  {
    icon: "graduation-cap",
    label: t("Qualification", "योग्यता"),
    value: t(
      "B.A.M.S. — Ayurvedacharya, C.S.J.M. University, Kanpur",
      "बी.ए.एम.एस. — आयुर्वेदाचार्य, सी.एस.जे.एम. विश्वविद्यालय, कानपुर",
    ),
  },
  {
    icon: "stethoscope",
    label: t("Speciality", "विशेषज्ञता"),
    value: t("General Physician", "जनरल फिजिशियन"),
  },
  {
    icon: "shield-check",
    label: t("State registration", "राज्य पंजीकरण"),
    value: t(
      "UK 1977 · Bhartiya Chikitsa Parishad, Uttarakhand",
      "UK 1977 · भारतीय चिकित्सा परिषद, उत्तराखण्ड",
    ),
  },
  {
    icon: "briefcase",
    label: t("Experience", "अनुभव"),
    value: t("25 years in hospital and clinical practice", "अस्पताल व क्लीनिक में 25 वर्ष"),
  },
  {
    icon: "building",
    label: t("Present post", "वर्तमान पद"),
    value: t("Medical Superintendent", "मेडिकल सुपरिंटेंडेंट"),
  },
  {
    icon: "languages",
    label: t("Speaks", "भाषाएँ"),
    value: t("Hindi, English, Kumaoni", "हिन्दी, अंग्रेज़ी, कुमाऊँनी"),
  },
];

/* ================================================================== */
/* What he treats                                                      */
/* ================================================================== */

/**
 * Scoped to ordinary general-physician OPD work. Nothing here claims a
 * super-speciality: the two conditions the newspaper clipping records him
 * counselling on — blood pressure and diabetes — lead the list, and the rest is
 * the everyday range any general physician's OPD sees.
 */
export const expertise: Array<{
  icon: string;
  title: Bilingual;
  detail: Bilingual;
}> = [
  {
    icon: "activity",
    title: t("Blood pressure", "रक्तचाप (बी.पी.)"),
    detail: t(
      "Diagnosis, medication review and long-term monitoring of high blood pressure.",
      "उच्च रक्तचाप की जाँच, दवा की समीक्षा और दीर्घकालिक निगरानी।",
    ),
  },
  {
    icon: "droplet",
    title: t("Diabetes", "मधुमेह"),
    detail: t(
      "Sugar testing, treatment and the diet and lifestyle guidance that goes with it.",
      "शुगर जाँच, उपचार और उसके साथ ज़रूरी खान-पान व जीवनशैली परामर्श।",
    ),
  },
  {
    icon: "thermometer",
    title: t("Fever and infections", "बुखार व संक्रमण"),
    detail: t(
      "Seasonal fever, typhoid, viral illness and other common infections.",
      "मौसमी बुखार, टाइफाइड, वायरल और अन्य सामान्य संक्रमण।",
    ),
  },
  {
    icon: "wind",
    title: t("Cough, asthma and allergy", "खांसी, दमा व एलर्जी"),
    detail: t(
      "Breathing trouble, long-standing cough and dust or seasonal allergy.",
      "सांस की तकलीफ़, पुरानी खांसी और धूल या मौसमी एलर्जी।",
    ),
  },
  {
    icon: "pill",
    title: t("Stomach and digestion", "पेट व पाचन"),
    detail: t(
      "Acidity, gas, constipation, loose motions and appetite complaints.",
      "एसिडिटी, गैस, कब्ज़, दस्त और भूख से जुड़ी शिकायतें।",
    ),
  },
  {
    icon: "bone",
    title: t("Body and joint pain", "शरीर व जोड़ों का दर्द"),
    detail: t(
      "Everyday joint, back and muscular pain, with referral onward where needed.",
      "रोज़मर्रा का जोड़ों, कमर व मांसपेशियों का दर्द, आवश्यकता पड़ने पर आगे रेफरल।",
    ),
  },
  {
    icon: "heart-pulse",
    title: t("Weakness and anaemia", "कमज़ोरी व खून की कमी"),
    detail: t(
      "Persistent tiredness, low haemoglobin and nutritional deficiency.",
      "लगातार थकान, हीमोग्लोबिन की कमी और पोषण की कमी।",
    ),
  },
  {
    icon: "leaf",
    title: t("Diet and lifestyle advice", "खान-पान व जीवनशैली परामर्श"),
    detail: t(
      "Practical changes to food and daily routine to keep lifestyle disease away.",
      "जीवनशैली से जुड़ी बीमारियों से बचने के लिए खान-पान व दिनचर्या में व्यावहारिक बदलाव।",
    ),
  },
];

/* ================================================================== */
/* Career                                                              */
/* ================================================================== */

/**
 * Ordered oldest-to-most-recent, as dictated by the profile note. Individual
 * joining years were not recorded, so no dates are shown — a fabricated
 * timeline would be easy to disprove and would undermine everything else here.
 */
export const career: Array<{ hospital: Bilingual; note?: Bilingual }> = [
  {
    hospital: t("Krishna Hospital & Research Centre (KHRC), Haldwani", "कृष्णा हॉस्पिटल एंड रिसर्च सेंटर (KHRC), हल्द्वानी"),
    note: t("Multi-speciality and trauma centre", "मल्टी-स्पेशलिटी एवं ट्रॉमा सेंटर"),
  },
  { hospital: t("Bombay Hospital", "बॉम्बे हॉस्पिटल") },
  { hospital: t("City Hospital", "सिटी हॉस्पिटल") },
  { hospital: t("Shaukat Hospital", "शौकत हॉस्पिटल") },
  { hospital: t("Good Health Hospital", "गुड हेल्थ हॉस्पिटल") },
  {
    hospital: t("Neelkanth Hospital, Haldwani", "नीलकंठ हॉस्पिटल, हल्द्वानी"),
    note: t("Multi-speciality hospital", "मल्टी-स्पेशलिटी अस्पताल"),
  },
  {
    hospital: t("Sanjeevani Hospital", "संजीवनी हॉस्पिटल"),
    note: t("Most recent hospital posting", "सबसे हाल की अस्पताल नियुक्ति"),
  },
];

/* ================================================================== */
/* Community work and recognition                                      */
/* ================================================================== */

export const recognition: Array<{
  title: Bilingual;
  awardedBy: Bilingual;
  date: Bilingual;
  detail: Bilingual;
}> = [
  {
    title: t("Samman Patra", "सम्मान पत्र"),
    awardedBy: t("Sauhard Jan Seva Samiti, Haldwani", "सौहार्द जन सेवा समिति, हल्द्वानी"),
    date: t("31 October 2020", "31 अक्टूबर 2020"),
    detail: t(
      "Honoured for giving free medical consultation to the general public over the preceding three to four years.",
      "विगत तीन-चार वर्षों से आम जनमानस को निःशुल्क चिकित्सकीय परामर्श देने के लिए सम्मानित।",
    ),
  },
  {
    title: t("Prashasti Patra", "प्रशस्ति पत्र"),
    awardedBy: t("Sauhard Jan Seva Samiti, Haldwani", "सौहार्द जन सेवा समिति, हल्द्वानी"),
    date: t("26 July 2025", "26 जुलाई 2025"),
    detail: t(
      "Presented for his part in the free medical camp organised by the Samiti, signed by patron Shri P. C. Pant and founder-president Smt. Vidya Mahtolia.",
      "समिति द्वारा आयोजित निःशुल्क चिकित्सा शिविर में सहयोग हेतु प्रदान किया गया; संरक्षक श्री पी. सी. पंत एवं संस्थापक/अध्यक्ष श्रीमती विद्या महतोलिया द्वारा हस्ताक्षरित।",
    ),
  },
  {
    title: t("Teachers' Day health camp", "शिक्षक दिवस स्वास्थ्य शिविर"),
    awardedBy: t("Reported in Dainik Jagran", "दैनिक जागरण में प्रकाशित"),
    date: t("Teachers' Day", "शिक्षक दिवस"),
    detail: t(
      "Screened and counselled more than 100 teachers at a free camp held at Sinthiya School with Dainik Jagran, advising changes in diet and routine to prevent blood pressure and diabetes.",
      "दैनिक जागरण के सहयोग से सिंथिया स्कूल में आयोजित निःशुल्क शिविर में 100 से अधिक शिक्षकों की जाँच व परामर्श; रक्तचाप और मधुमेह से बचाव हेतु खान-पान व दिनचर्या में बदलाव की सलाह दी।",
    ),
  },
];

/* ================================================================== */
/* Gallery                                                             */
/* ================================================================== */

/**
 * Paths point at /public/images/*. Files that have not been dropped in yet fall
 * back to a designed tile via <SmartImage>, so the grid never shows a broken
 * image. See README for the exact filenames expected.
 */
export const gallery: Array<{
  src: string;
  alt: Bilingual;
  caption: Bilingual;
  /** Portrait-shaped sources get a taller tile so nothing is cropped away. */
  portrait?: boolean;
}> = [
  {
    src: "/images/clinic/consulting-room.jpg",
    alt: t("Dr. Pundir at his consulting desk", "अपने परामर्श कक्ष में डॉ. पुंडीर"),
    caption: t("The consulting room", "परामर्श कक्ष"),
  },
  {
    src: "/images/clinic/consultation.jpg",
    alt: t("Dr. Pundir speaking with a patient", "मरीज़ से बात करते डॉ. पुंडीर"),
    caption: t("In consultation", "परामर्श के दौरान"),
  },
  {
    src: "/images/clinic/clinic-desk.jpg",
    alt: t("The clinic desk and patient education material", "क्लीनिक डेस्क और मरीज़ों की जानकारी सामग्री"),
    caption: t("At the clinic", "क्लीनिक में"),
  },
  {
    src: "/images/credentials/registration-certificate.jpg",
    alt: t(
      "Uttarakhand Bhartiya Chikitsa Parishad registration certificate",
      "भारतीय चिकित्सा परिषद उत्तराखण्ड का निबन्धन प्रमाण-पत्र",
    ),
    caption: t("Registration certificate · UK 1977", "निबन्धन प्रमाण-पत्र · UK 1977"),
    portrait: true,
  },
  {
    src: "/images/recognition/samman-patra-2020.jpg",
    alt: t("Samman Patra from Sauhard Jan Seva Samiti", "सौहार्द जन सेवा समिति का सम्मान पत्र"),
    caption: t("Samman Patra, 2020", "सम्मान पत्र, 2020"),
    portrait: true,
  },
  {
    src: "/images/recognition/prashasti-patra-2025.jpg",
    alt: t("Prashasti Patra for the free medical camp", "निःशुल्क चिकित्सा शिविर हेतु प्रशस्ति पत्र"),
    caption: t("Prashasti Patra, 2025", "प्रशस्ति पत्र, 2025"),
  },
  {
    src: "/images/recognition/dainik-jagran-camp.jpg",
    alt: t(
      "Dainik Jagran report on the Teachers' Day health camp",
      "शिक्षक दिवस स्वास्थ्य शिविर पर दैनिक जागरण की रिपोर्ट",
    ),
    caption: t("Dainik Jagran · health camp", "दैनिक जागरण · स्वास्थ्य शिविर"),
  },
];

/* ================================================================== */
/* Navigation                                                          */
/* ================================================================== */

/**
 * Root-relative rather than bare fragments (`/#about`, not `#about`). The header
 * and footer are rendered on /book and /admin too, where a bare `#about` would
 * resolve against a page that has no such section and silently do nothing.
 */
export const navLinks: Array<{ href: string; label: Bilingual }> = [
  { href: "/#about", label: t("About", "परिचय") },
  { href: "/#expertise", label: t("Treatment", "उपचार") },
  { href: "/#experience", label: t("Experience", "अनुभव") },
  { href: "/#clinic", label: t("Clinic", "क्लीनिक") },
  { href: "/#recognition", label: t("Recognition", "सम्मान") },
  { href: "/#contact", label: t("Contact", "संपर्क") },
];

/* ================================================================== */
/* Quick facts strip                                                   */
/* ================================================================== */

export const quickFacts: Array<{
  value: Bilingual;
  label: Bilingual;
  icon: string;
}> = [
  {
    value: t("25 years", "25 वर्ष"),
    label: t("of clinical practice", "का चिकित्सकीय अनुभव"),
    icon: "briefcase",
  },
  {
    value: t("₹50", "₹50"),
    label: t("consultation fee only", "परामर्श शुल्क मात्र"),
    icon: "indian-rupee",
  },
  {
    value: t("5 days", "5 दिन"),
    label: t("one slip stays valid", "तक पर्चा मान्य"),
    icon: "calendar-check",
  },
  {
    value: t("B.A.M.S.", "बी.ए.एम.एस."),
    label: t("Reg. UK 1977, Uttarakhand", "पंजीकरण UK 1977, उत्तराखण्ड"),
    icon: "shield-check",
  },
];
