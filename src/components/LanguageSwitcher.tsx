import { useEffect, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            autoDisplay: boolean;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

// Add/remove languages here freely — code must be a valid Google Translate code.
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "nl", label: "Dutch" },
  { code: "pl", label: "Polish" },
  { code: "hu", label: "Hungarian" },
  { code: "ro", label: "Romanian" },
  { code: "sv", label: "Swedish" },
  { code: "el", label: "Greek" },
  { code: "cs", label: "Czech" },
  { code: "uk", label: "Ukrainian" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "ar", label: "Arabic" },
  { code: "he", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "zh-CN", label: "Chinese (Simplified)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "vi", label: "Vietnamese" },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian" },
  { code: "sw", label: "Swahili" },
];

const PAGE_LANGUAGE = "en";
const COOKIE_NAME = "googtrans";
const AUTO_DETECT_FLAG = "lang_auto_detected";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setLangCookie(targetCode: string) {
  const value = `/${PAGE_LANGUAGE}/${targetCode}`;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${oneYear}`;
  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 2) {
    const parentDomain = "." + parts.slice(-2).join(".");
    document.cookie = `${COOKIE_NAME}=${value}; path=/; domain=${parentDomain}; max-age=${oneYear}`;
  }
}

function clearLangCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

function loadGoogleTranslateScript() {
  if (document.getElementById("google-translate-script")) return;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate) return;
    new window.google.translate.TranslateElement(
      {
        pageLanguage: PAGE_LANGUAGE,
        includedLanguages: LANGUAGES.map((l) => l.code).join(","),
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState("en");

  useEffect(() => {
    loadGoogleTranslateScript();

    const cookieVal = getCookie(COOKIE_NAME);
    if (cookieVal) {
      const to = cookieVal.split("/")[2];
      if (to) setCurrent(to);
      return;
    }

    if (sessionStorage.getItem(AUTO_DETECT_FLAG)) return;
    sessionStorage.setItem(AUTO_DETECT_FLAG, "1");

    const browserLang = (navigator.language || "en").toLowerCase();
    const short = browserLang.split("-")[0];
    const supported = LANGUAGES.find(
      (l) => l.code.toLowerCase() === browserLang || l.code.toLowerCase() === short
    );

    if (supported && supported.code !== PAGE_LANGUAGE) {
      setLangCookie(supported.code);
      window.location.reload();
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const code = e.target.value;
    if (code === current) return;
    if (code === PAGE_LANGUAGE) clearLangCookie();
    else setLangCookie(code);
    window.location.reload();
  }

  return (
    <div className="relative inline-block">
      {/* Required host div for Google's script — kept in DOM but visually hidden */}
      <div id="google_translate_element" className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none" />

      <div className="relative flex items-center gap-1 rounded-full border border-white/15 bg-black/40 backdrop-blur pl-2.5 pr-5 py-1">
        <span className="text-xs leading-none pointer-events-none">🌐</span>
        <select
          value={current}
          onChange={handleChange}
          aria-label="Select language"
          className="appearance-none bg-transparent text-xs font-medium text-white outline-none cursor-pointer pr-1 max-w-[64px] truncate"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} className="bg-[#111] text-white">
              {lang.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-white/70">
          ▼
        </span>
      </div>
    </div>
  );
}
