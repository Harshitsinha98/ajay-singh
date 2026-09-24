"use client";

/**
 * Site-wide Hindi/English switch.
 *
 * Most walk-in patients in Haldwani read Devanagari far more comfortably than
 * English, but the son or daughter searching Google on their behalf is often
 * the one reading English. So both languages are first-class, the choice is
 * remembered, and the `lang` attribute is kept in sync so the Devanagari font
 * and the looser line-height declared in globals.css actually apply.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Bilingual } from "@/lib/doctor";
import { pick, type Lang } from "@/lib/copy";

const STORAGE_KEY = "apc.lang";
/** Hindi first — it is what most patients at this clinic prefer. */
const DEFAULT_LANG: Lang = "hi";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Resolves a bilingual value against the active language. */
  t: (value: Bilingual) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // The stored preference is read after mount rather than during render, so the
  // server and first client render are identical and there is no hydration
  // mismatch to warn about.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "hi" || stored === "en") {
        setLangState(stored);
      } else if (navigator.language && !navigator.language.startsWith("hi")) {
        // A browser set to English is a reasonable opening guess, but only
        // that — the toggle wins from then on.
        setLangState("en");
      }
    } catch {
      /* Private browsing can throw on localStorage; the default is fine. */
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* The preference just will not persist. */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "hi" ? "en" : "hi"),
      t: (bilingual: Bilingual) => pick(bilingual, lang),
    }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLang must be used inside <LanguageProvider>");
  }
  return context;
}
