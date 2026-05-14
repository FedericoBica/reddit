"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setLocale } from "@/modules/i18n/actions";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const fd = new FormData();
    fd.set("locale", value);
    startTransition(async () => {
      await setLocale(fd);
    });
  }

  return (
    <div className="field-group">
      <span className="field-label">{t("appLanguage")}</span>
      <select
        defaultValue={currentLocale}
        className="select"
        style={{ maxWidth: 200, opacity: isPending ? 0.6 : 1 }}
        onChange={handleChange}
        disabled={isPending}
      >
        <option value="auto">{t("languageOptions.auto")}</option>
        <option value="en">{t("languageOptions.en")}</option>
        <option value="es">{t("languageOptions.es")}</option>
        <option value="pt">{t("languageOptions.pt")}</option>
      </select>
      <span className="field-hint">{t("appLanguageHint")}</span>
    </div>
  );
}
