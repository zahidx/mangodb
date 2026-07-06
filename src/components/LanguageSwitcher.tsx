// ===========================================
// Language Switcher — Toggle between English & Bangla
// ===========================================
"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Globe } from "lucide-react";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { locale, setLocale, isRTL } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-emerald-500 transition-all cursor-pointer text-xs font-bold"
        aria-label="Switch language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{locale === "en" ? "EN" : "বাং"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[140px]">
            <button
              onClick={() => { setLocale("en"); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                locale === "en"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "text-muted-foreground hover:bg-muted-bg hover:text-hero-text"
              }`}
            >
              <span className="text-base">🇬🇧</span>
              English
              {locale === "en" && <span className="ml-auto text-emerald-500">✓</span>}
            </button>
            <button
              onClick={() => { setLocale("bn"); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                locale === "bn"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "text-muted-foreground hover:bg-muted-bg hover:text-hero-text"
              }`}
            >
              <span className="text-base">🇧🇩</span>
              বাংলা
              {locale === "bn" && <span className="ml-auto text-emerald-500">✓</span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
