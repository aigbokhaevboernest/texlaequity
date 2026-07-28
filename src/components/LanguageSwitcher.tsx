import { useEffect, useRef, useState } from "react";

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

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "hi", label: "Hindi" },
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
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(code: string) {
    setOpen(false);
    if (code === current) return;
    if (code === PAGE_LANGUAGE) clearLangCookie();
    else setLangCookie(code);
    window.location.reload();
  }

  const currentLabel = LANGUAGES.find((l) => l.code === current)?.label ?? "Language";

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Required host div for Google's script — kept in DOM but visually hidden */}
      <div id="google_translate_element" className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none" />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 backdrop-blur px-4 py-2 text-sm font-medium text-white hover:border-white/30 transition-colors"
      >
        <span className="text-base leading-none">🌐</span>
        <span>{currentLabel}</span>
        <span className="text-[10px] opacity-80">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-52 max-h-80 overflow-y-auto rounded-2xl bg-[#f3f0fb] p-1.5 shadow-xl z-50"
        >
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-2 text-left rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-black/5 ${
                  lang.code === current ? "bg-blue-500/15 font-semibold text-blue-900" : ""
                }`}
              >
                {lang.code === current && <span className="text-xs">✓</span>}
                {lang.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
