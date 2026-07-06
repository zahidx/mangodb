// ===========================================
// Language Context — Client-side i18n without route restructuring
// ===========================================
"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Locale = "en" | "bn";
type Messages = Record<string, any>;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  messages: Messages;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cache loaded messages
const messageCache: Partial<Record<Locale, Messages>> = {};

async function loadMessages(locale: Locale): Promise<Messages> {
  if (messageCache[locale]) return messageCache[locale]!;
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    messageCache[locale] = messages;
    return messages;
  } catch {
    return {};
  }
}

function resolveNestedKey(obj: any, key: string): string {
  const keys = key.split(".");
  let result = obj;
  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      return key; // fallback: return the key itself
    }
  }
  return typeof result === "string" ? result : key;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("mangodb-locale") as Locale | null;
    if (saved && (saved === "en" || saved === "bn")) {
      setLocaleState(saved);
      loadMessages(saved).then(setMessages);
    } else {
      loadMessages("en").then(setMessages);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("mangodb-locale", newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "bn" ? "rtl" : "ltr";
    loadMessages(newLocale).then(setMessages);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = resolveNestedKey(messages, key);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [messages]
  );

  const isRTL = locale === "bn";

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, messages, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
