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
  { code: "tr", label: "Türkçe", flag: "🇹" },
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
  // Skip domain-scoped cookies on plain IPs / localhost, where a leading
  // dot isn't valid.
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  if (host === "localhost" || isIp) return;
  const parts = host.split(".");
  // parts.length >= 2 covers both apex (example.com) and subdomains
  // (www.example.com) — previously only subdomains got the domain-scoped
  // cookie, so language didn't persist when a user landed on the apex host.
  if (parts.length >= 2) {
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

// Drives Google's own hidden <select class="goog-te-combo"> directly instead
// of reloading the page. This is what the widget's own UI does internally —
// setting the value and firing `change` makes Google rewrite the DOM in
// place, with no navigation.
function applyGoogleLang(code: string): boolean {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  if (combo.value === code) return true;
  combo.value = code;
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

// The combo element only exists once Google's script has finished booting
// and injecting its widget, which happens async and can take a beat —
// especially right after a refresh. Poll briefly instead of assuming it's
// there immediately.
function applyGoogleLangWithRetry(code: string, attempts = 30, intervalMs = 200) {
  let tries = 0;
  const interval = setInterval(() => {
    tries += 1;
    const applied = applyGoogleLang(code);
    if (applied || tries >= attempts) {
      clearInterval(interval);
    }
  }, intervalMs);
  // Try immediately too, in case the combo is already there.
  const applied = applyGoogleLang(code);
  if (applied) clearInterval(interval);
}

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState("en");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGoogleTranslateScript();

    // Google's banner iframe is hidden via CSS (index.css), but Google also
    // sets inline styles (including an inline `top` offset on <body>) after
    // that CSS loads, which can win the timing race. This actively re-hides
    // the banner iframe itself and resets the body offset whenever Google
    // touches the DOM, as a backstop to the CSS rules.
    const suppressBanner = () => {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
      }
      document.querySelectorAll<HTMLElement>(
        'iframe.goog-te-banner-frame, iframe[id^="goog-gt-tt"], .goog-te-banner-frame, .skiptranslate iframe, body > .skiptranslate'
      ).forEach((el) => {
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.height = "0px";
      });
    };
    const observer = new MutationObserver(suppressBanner);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    });
    suppressBanner();

    // Re-apply translation state on load/refresh — the cookie alone doesn't
    // reliably make Google re-translate on its own, so once the widget is
    // ready we drive it via the combo, same as a manual language pick.
    const cookieVal = getCookie(COOKIE_NAME);
    if (cookieVal) {
      const to = cookieVal.split("/")[2];
      if (to && to !== PAGE_LANGUAGE) {
        setCurrent(to);
        document.documentElement.setAttribute("lang", to);
        applyGoogleLangWithRetry(to);
      }
      return () => observer.disconnect();
    }

    if (!sessionStorage.getItem(AUTO_DETECT_FLAG)) {
      sessionStorage.setItem(AUTO_DETECT_FLAG, "1");
      const browserLang = (navigator.language || "en").toLowerCase();
      const short = browserLang.split("-")[0];
      const supported = LANGUAGES.find(
        (l) => l.code.toLowerCase() === browserLang || l.code.toLowerCase() === short
      );
      if (supported && supported.code !== PAGE_LANGUAGE) {
        setLangCookie(supported.code);
        setCurrent(supported.code);
        document.documentElement.setAttribute("lang", supported.code);
        applyGoogleLangWithRetry(supported.code);
      }
    }

    return () => observer.disconnect();
  }, []);

  // Close the dropdown on outside click / Escape.
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
    setCurrent(code);
    document.documentElement.setAttribute("lang", code);

    if (code === PAGE_LANGUAGE) {
      // "Back to English" — clear the cookie so refreshes stay untranslated,
      // and tell the live combo to revert (Google treats source→source as
      // "show original").
      clearLangCookie();
      applyGoogleLangWithRetry(PAGE_LANGUAGE);
    } else {
      setLangCookie(code);
      applyGoogleLangWithRetry(code);
    }
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
