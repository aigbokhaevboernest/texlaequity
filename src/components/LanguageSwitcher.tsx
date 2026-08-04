import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

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
// `flag` is just a visual emoji flag next to the language name (matches the
// convention Google's own widget uses — flag of a representative country,
// not a literal "this is the country" claim).
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "zh-CN", label: "中文 (简体)", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

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

  // Close the dropdown on outside click / Escape so it doesn't linger over
  // page content while the user navigates around.
  useEffect(() => {
    if (!open) return;

    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function selectLanguage(code: string) {
    setOpen(false);
    if (code === current) return;
    if (code === PAGE_LANGUAGE) clearLangCookie();
    else setLangCookie(code);
    window.location.reload();
  }

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div ref={rootRef} className="fixed bottom-4 left-4 z-[9999]">
      {/* Required host div for Google's script — kept in DOM but visually hidden */}
      <div
        id="google_translate_element"
        className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none"
      />

      {/* Dropdown panel — opens upward since the button sits at the bottom */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute bottom-full left-0 mb-2 w-64 max-h-80 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-xl py-1"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={lang.code === current}
              onClick={() => selectLanguage(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] hover:bg-black/5 transition-colors ${
                lang.code === current ? "bg-black/[0.04] font-medium" : ""
              }`}
            >
              <span className="text-lg leading-none shrink-0">{lang.flag}</span>
              <span className="text-[#111] truncate">{lang.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 backdrop-blur px-3.5 py-2.5 text-white shadow-lg hover:bg-black/80 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg leading-none">{currentLang.flag}</span>
        <span className="text-[10px] text-white/70">▼</span>
      </button>
    </div>
  );
}
