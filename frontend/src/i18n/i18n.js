import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(HttpBackend)              // Load translations using HTTP
  .use(LanguageDetector)         // Detect language in browser
  .use(initReactI18next)         // Passes i18n instance to react-i18next
  .init({
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json", // Path to translation files
    },
    react: {
      useSuspense: true, // Optionally load translations asynchronously
    },
  });

export default i18n;
