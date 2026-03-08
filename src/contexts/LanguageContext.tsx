import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Language } from "@/i18n/translations";

const LANG_KEY = "dsdeck_lang";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return (saved === "es" ? "es" : "en") as Language;
  });

  function setLang(l: Language) {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
