/**
 * Static UI copy in both languages.
 *
 * Facts about the practice live in doctor.ts; this file is only chrome —
 * button labels, section headings, empty states. Kept flat and typed so a
 * missing translation is a compile error rather than a blank label on a
 * patient's phone.
 */

import type { Bilingual } from "./doctor";

export type Lang = "en" | "hi";

/** Picks the right half of a bilingual value. */
export function pick(value: Bilingual, lang: Lang): string {
  return lang === "hi" ? value.hi : value.en;
}

const t = (en: string, hi: string): Bilingual => ({ en, hi });

export const copy = {
  /* --- global chrome --- */
  brandSub: t("Sarvodaya Vihar · Haldwani", "सर्वोदय विहार · हल्द्वानी"),
  callNow: t("Call Now", "अभी कॉल करें"),
  whatsapp: t("WhatsApp", "व्हाट्सएप"),
  getDirections: t("Get Directions", "रास्ता देखें"),
  directions: t("Directions", "रास्ता"),
  languageToggle: t("हिन्दी", "English"),
  skipToContent: t("Skip to main content", "मुख्य सामग्री पर जाएँ"),
  menu: t("Menu", "मेनू"),
  close: t("Close", "बंद करें"),

  /* --- hero --- */
  heroBadge: t("General Physician · Haldwani", "जनरल फिजिशियन · हल्द्वानी"),
  heroTitleLead: t("Unhurried care from a", "भरोसेमंद इलाज, एक ऐसे"),
  heroTitleAccent: t("doctor who listens", "डॉक्टर से जो सुनता है"),
  heroIntro: t(
    "Twenty-five years of general practice in Haldwani — blood pressure, diabetes, fever, and the everyday complaints a family brings through the door. Consultation is ₹50, and the slip stays valid for five days.",
    "हल्द्वानी में जनरल प्रैक्टिस के पच्चीस वर्ष — रक्तचाप, मधुमेह, बुखार और वे रोज़मर्रा की तकलीफ़ें जिनके लिए परिवार डॉक्टर के पास आता है। परामर्श शुल्क ₹50 और पर्चा पाँच दिन तक मान्य।",
  ),
  heroPhotoCaption: t("Dr. Ajay Pundir at his clinic", "अपने क्लीनिक में डॉ. अजय पुंडीर"),

  /* --- about --- */
  aboutEyebrow: t("About the doctor", "डॉक्टर का परिचय"),
  aboutLead: t("Twenty-five years", "पच्चीस वर्षों से"),
  aboutAccent: t("in Haldwani's hospitals", "हल्द्वानी के अस्पतालों में"),
  registrationHeading: t("Council registration", "परिषद पंजीकरण"),
  regNumber: t("Registration no.", "निबन्धन संख्या"),
  regSerial: t("Serial no.", "क्रमांक"),
  regDate: t("Registered on", "निबन्धन तिथि"),
  regValid: t("Valid till", "मान्यता"),
  regCouncil: t("Council", "परिषद"),
  regQualification: t("Qualification on certificate", "प्रमाण-पत्र पर योग्यता"),
  verifyNote: t(
    "Registration details are reproduced from the certificate issued by the Bhartiya Chikitsa Parishad, Uttarakhand.",
    "पंजीकरण विवरण भारतीय चिकित्सा परिषद, उत्तराखण्ड द्वारा जारी प्रमाण-पत्र से लिया गया है।",
  ),

  /* --- expertise --- */
  expertiseEyebrow: t("What is treated here", "यहाँ क्या इलाज होता है"),
  expertiseLead: t("Everyday medicine,", "रोज़मर्रा की चिकित्सा,"),
  expertiseAccent: t("done properly", "पूरे ध्यान से"),
  expertiseIntro: t(
    "A general physician's OPD covers most of what a family actually needs. Anything that calls for a surgeon or a super-speciality opinion is referred onward rather than kept.",
    "एक जनरल फिजिशियन की ओ.पी.डी. परिवार की अधिकांश ज़रूरतों को कवर करती है। जिस स्थिति में सर्जन या सुपर-स्पेशलिटी राय आवश्यक हो, उसे रोका नहीं जाता — आगे रेफर किया जाता है।",
  ),

  /* --- experience --- */
  experienceEyebrow: t("Hospitals served", "सेवा दिए अस्पताल"),
  experienceLead: t("Where these", "ये पच्चीस वर्ष"),
  experienceAccent: t("25 years were spent", "कहाँ बीते"),
  currentlyLabel: t("Currently", "वर्तमान में"),
  experienceNote: t(
    "Listed in the order the doctor recorded them. Joining years are not shown because they are not part of the record supplied.",
    "क्रम वही है जो डॉक्टर द्वारा दर्ज कराया गया। जुड़ने के वर्ष उपलब्ध विवरण में नहीं हैं, इसलिए नहीं दिखाए गए हैं।",
  ),

  /* --- clinic --- */
  clinicEyebrow: t("Visiting the clinic", "क्लीनिक आने से पहले"),
  clinicLead: t("Address, fee and", "पता, शुल्क और"),
  clinicAccent: t("what to expect", "ज़रूरी जानकारी"),
  addressHeading: t("Clinic address", "क्लीनिक का पता"),
  timingHeading: t("Timings", "समय"),
  beforeYouComeHeading: t("Before you come", "आने से पहले"),
  feeHeading: t("Consultation fee", "परामर्श शुल्क"),
  closedOn: t("Closed on", "अवकाश"),
  callToConfirm: t("Call to confirm timing", "समय की पुष्टि हेतु कॉल करें"),

  /* --- recognition --- */
  recognitionEyebrow: t("Community work", "सामाजिक सेवा"),
  recognitionLead: t("Free camps and", "निःशुल्क शिविर और"),
  recognitionAccent: t("local recognition", "स्थानीय सम्मान"),
  recognitionIntro: t(
    "Several years of free consultation at community camps around Haldwani, recognised by Sauhard Jan Seva Samiti and covered in the local press.",
    "हल्द्वानी के आसपास सामुदायिक शिविरों में कई वर्षों का निःशुल्क परामर्श, जिसे सौहार्द जन सेवा समिति ने सम्मानित किया और स्थानीय अख़बारों ने प्रकाशित किया।",
  ),

  /* --- gallery --- */
  galleryEyebrow: t("Gallery", "गैलरी"),
  galleryLead: t("The clinic and", "क्लीनिक और"),
  galleryAccent: t("the certificates", "प्रमाण-पत्र"),
  photoComingSoon: t("Photograph to be added", "फ़ोटो जोड़ी जानी है"),

  /* --- contact --- */
  contactEyebrow: t("Contact", "संपर्क"),
  contactLead: t("Call, message or", "कॉल करें, संदेश भेजें या"),
  contactAccent: t("simply walk in", "सीधे आ जाएँ"),
  contactIntro: t(
    "There is no online booking — a phone call or a WhatsApp message is enough, and walk-in patients are seen the same way.",
    "ऑनलाइन बुकिंग की व्यवस्था नहीं है — एक कॉल या व्हाट्सएप संदेश पर्याप्त है, और सीधे आने वाले मरीज़ भी इसी तरह देखे जाते हैं।",
  ),
  phoneLabel: t("Phone", "फ़ोन"),
  emailLabel: t("Email", "ईमेल"),
  whatsappPrefill: t(
    "Hello Doctor, I would like to ask about a consultation.",
    "नमस्ते डॉक्टर, मुझे परामर्श के बारे में जानकारी चाहिए।",
  ),

  /* --- emergency / disclaimer --- */
  emergencyHeading: t("In an emergency", "आपात स्थिति में"),
  emergencyBody: t(
    "This clinic is an OPD and is not an emergency facility. For a medical emergency call the national ambulance service on 108, or go to the nearest hospital casualty.",
    "यह क्लीनिक ओ.पी.डी. है, आपातकालीन सुविधा नहीं। किसी भी मेडिकल इमरजेंसी में राष्ट्रीय एम्बुलेंस सेवा 108 पर कॉल करें या नज़दीकी अस्पताल की कैजुअल्टी में जाएँ।",
  ),
  disclaimer: t(
    "The information on this site is for general awareness only and is not a substitute for an in-person consultation, diagnosis or prescription. Please do not begin or stop any medicine on the basis of this page alone.",
    "इस वेबसाइट की जानकारी केवल सामान्य जागरूकता के लिए है और किसी व्यक्तिगत परामर्श, जाँच या दवा की पर्ची का विकल्प नहीं है। कृपया केवल इस पृष्ठ के आधार पर कोई दवा शुरू या बंद न करें।",
  ),

  /* --- token booking --- */
  bookToken: t("Book Token", "टोकन बुक करें"),
  tokenLabel: t("Token", "टोकन"),
  bookingEyebrow: t("Online token", "ऑनलाइन टोकन"),
  bookingLead: t("Get your token", "अपना टोकन लें"),
  bookingAccent: t("before you come", "आने से पहले"),
  bookingIntro: t(
    "Pick a day and a time, give the patient's name and mobile number, and you will get a token number. Show it at the counter — the ₹50 slip is still made there.",
    "दिन और समय चुनें, मरीज़ का नाम और मोबाइल नंबर दें, और आपको टोकन नंबर मिल जाएगा। काउंटर पर दिखा दें — ₹50 का पर्चा वहीं बनेगा।",
  ),

  stepDate: t("Day", "दिन"),
  stepSlot: t("Time", "समय"),
  stepDetails: t("Details", "विवरण"),

  chooseDay: t("Choose a day", "दिन चुनें"),
  chooseTime: t("Choose a time", "समय चुनें"),
  patientDetails: t("Patient details", "मरीज़ का विवरण"),
  slotsFree: t("free", "खाली"),
  noSlotsLeft: t(
    "No time is left on this day. Please pick another day.",
    "इस दिन कोई समय खाली नहीं है। कृपया दूसरा दिन चुनें।",
  ),
  clinicClosedThatDay: t(
    "The clinic is closed on this day.",
    "इस दिन क्लीनिक बंद रहता है।",
  ),
  slotTaken: t("Taken", "बुक"),
  slotPassed: t("Passed", "समय बीत गया"),

  fieldName: t("Patient's full name", "मरीज़ का पूरा नाम"),
  fieldPhone: t("Mobile number", "मोबाइल नंबर"),
  fieldAge: t("Age", "उम्र"),
  fieldGender: t("Gender", "लिंग"),
  fieldReason: t("What is the problem? (optional)", "क्या तकलीफ़ है? (वैकल्पिक)"),
  genderMale: t("Male", "पुरुष"),
  genderFemale: t("Female", "महिला"),
  genderOther: t("Other", "अन्य"),
  optional: t("optional", "वैकल्पिक"),

  confirmBooking: t("Confirm token", "टोकन पक्का करें"),
  booking: t("Booking…", "बुक हो रहा है…"),
  back: t("Back", "पीछे"),
  somethingWrong: t(
    "Something went wrong. Please try again, or call the clinic.",
    "कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें, या क्लीनिक पर कॉल करें।",
  ),
  loading: t("Loading…", "लोड हो रहा है…"),

  tokenBooked: t("Your token is booked", "आपका टोकन बुक हो गया"),
  yourTokenNumber: t("Token number", "टोकन नंबर"),
  bookingCode: t("Booking code", "बुकिंग कोड"),
  reportBy: t("Please arrive by", "कृपया पहुँचें"),
  patientsAhead: t("patients ahead of you", "आपसे पहले मरीज़"),
  saveThisCode: t(
    "Keep the booking code — it is needed to cancel.",
    "बुकिंग कोड संभाल कर रखें — रद्द करने के लिए ज़रूरी है।",
  ),
  sendToWhatsapp: t("Send to my WhatsApp", "मेरे व्हाट्सएप पर भेजें"),
  bookAnother: t("Book another token", "दूसरा टोकन बुक करें"),
  feeAtCounter: t(
    "Consultation fee ₹50, paid at the counter.",
    "परामर्श शुल्क ₹50, काउंटर पर देय।",
  ),

  scheduleProvisional: t(
    "Please note: these consultation timings are provisional and are still being confirmed with the clinic. Your token number and queue position are correct, but do ring before you travel.",
    "ध्यान दें: ये परामर्श समय अस्थायी हैं और क्लीनिक से पुष्टि की जा रही है। आपका टोकन नंबर और क्रम सही है, फिर भी आने से पहले एक बार कॉल कर लें।",
  ),

  cancelHeading: t("Cancel a token", "टोकन रद्द करें"),
  cancelIntro: t(
    "Enter the booking code and the mobile number it was booked with.",
    "बुकिंग कोड और जिस मोबाइल नंबर से बुक किया था, वह दर्ज करें।",
  ),
  cancelButton: t("Cancel token", "टोकन रद्द करें"),
  cancelling: t("Cancelling…", "रद्द हो रहा है…"),
  cancelled: t("That token has been cancelled.", "वह टोकन रद्द कर दिया गया है।"),

  /* --- footer --- */
  footerNav: t("Sections", "अनुभाग"),
  footerReach: t("Reach the clinic", "क्लीनिक तक पहुँचें"),
  footerRights: t("All rights reserved.", "सर्वाधिकार सुरक्षित।"),
};
