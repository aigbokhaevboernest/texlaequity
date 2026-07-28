import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean; includedLanguages?: string },
          elementId: string
        ) => void;
      };
    };
  }
}

const COOKIE_NAME = "googtrans";

function getCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export default function LanguageSwitcher() {
  useEffect(() => {
    // Load Google Translate script once
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    // Auto-translate once for non-English browsers (only if user hasn't chosen yet)
    const hasChoice = getCookie(COOKIE_NAME);
    if (!hasChoice) {
      const browserLang = (navigator.language || "en").split("-")[0].toLowerCase();
      if (browserLang && browserLang !== "en") {
        // Set cookie so Google Translate applies on this + future loads
        document.cookie = `${COOKIE_NAME}=/en/${browserLang}; path=/`;
        // Soft reload so the widget picks it up
        window.location.reload();
      }
    }
  }, []);

  return (
    <div className="flex justify-center mb-4">
      {/* Hidden host for the official widget */}
      <div id="google_translate_element" className="sr-only" aria-hidden="true" />

      {/* Visible dark pill — Google injects a <select> we restyle via CSS */}
      <div className="language-switcher-pill inline-flex items-center rounded-full border border-white/15 bg-black/60 backdrop-blur px-3 py-1.5 text-[12px] text-white/90 shadow-sm">
        <span className="mr-2 opacity-60 select-none">Language</span>
        {/* The widget's select will be moved/styled into this area by CSS below */}
      </div>

      <style>{`
        /* Hide default Google UI chrome */
        .goog-te-banner-frame,
        .goog-te-balloon-frame,
        #goog-gt-tt,
        .goog-te-spinner-pos,
        .goog-logo-link,
        .goog-te-gadget span {
          display: none !important;
        }
        body { top: 0 !important; }

        /* Style the injected select as a dark pill control */
        .goog-te-gadget {
          font-size: 0 !important;
        }
        .goog-te-combo {
          background: rgba(0,0,0,0.6) !important;
          color: #f5f5f5 !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          border-radius: 9999px !important;
          padding: 6px 12px !important;
          font-size: 12px !important;
          outline: none !important;
          cursor: pointer !important;
        }
        .goog-te-combo option {
          background: #111 !important;
          color: #f5f5f5 !important;
        }

        /* Sit the real select over our pill label area */
        #google_translate_element {
          position: absolute;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
