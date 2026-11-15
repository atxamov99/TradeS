import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { translations } from "./translations";

const LOCALE_STORAGE_KEY = "savdo-admin-locale";
const fallbackLocale = "uz";
const supportedLocales = ["uz", "en", "ru"];
const I18nContext = createContext(null);

// The language that is active RIGHT NOW. It is set synchronously when the language changes (not in an effect),
// so tx() below always answers in the language that is on screen, also for code outside React components
// (toasts, error messages, module-level labels).
let activeLocale = fallbackLocale;

export function tx(key, values = {}, fallback = key) {
  const dictionary = translations[activeLocale] || translations[fallbackLocale];
  const message = getNestedValue(dictionary, key) ?? getNestedValue(translations[fallbackLocale], key);
  if (message === undefined) return fallback;
  return typeof message === "string" ? interpolate(message, values) : message;
}

// The language that is active RIGHT NOW. It is set synchronously when the language changes (not in an effect),
// so tx() below always answers in the language that is on screen, also for code outside React components
// (toasts, error messages, module-level labels).
let activeLocale = fallbackLocale;

export function tx(key, values = {}, fallback = key) {
  const dictionary = translations[activeLocale] || translations[fallbackLocale];
  const message = getNestedValue(dictionary, key) ?? getNestedValue(translations[fallbackLocale], key);
  if (message === undefined) return fallback;
  return typeof message === "string" ? interpolate(message, values) : message;
}

function getNestedValue(source, key) {
  return key.split(".").reduce((current, segment) => current?.[segment], source);
}

function interpolate(template, values) {
  if (typeof template !== "string") {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token) =>
    values[token] === undefined ? `{${token}}` : String(values[token])
  );
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return fallbackLocale;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return supportedLocales.includes(storedLocale) ? storedLocale : fallbackLocale;
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    activeLocale = getStoredLocale();
    return activeLocale;
  });
  const setLocale = (next) => {
    activeLocale = next; // before the re-render, so tx() already speaks the new language
    setLocaleState(next);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => {
    const dictionary = translations[locale] || translations[fallbackLocale];

    return {
      locale,
      setLocale,
      supportedLocales,
      t: (key, values = {}, fallback = key) => {
        const message =
          getNestedValue(dictionary, key) ??
          getNestedValue(translations[fallbackLocale], key);

        if (message === undefined) {
          return fallback;
        }

        return typeof message === "string" ? interpolate(message, values) : message;
      }
    };
  }, [locale]);

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
