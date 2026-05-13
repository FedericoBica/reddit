"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Translations } from "../landing-i18n";

const STORAGE_KEY = "prowlit_cookie_consent";

export function CookieBanner({ t }: { t: Translations["cookieBanner"] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <p className="cookie-msg">
        {t.message}{" "}
        <Link href="/privacy" className="cookie-link">
          {t.learnMore}
        </Link>
      </p>
      <div className="cookie-actions">
        <button className="btn sm ghost" onClick={decline}>
          {t.decline}
        </button>
        <button className="btn primary sm" onClick={accept}>
          {t.accept}
        </button>
      </div>
    </div>
  );
}
