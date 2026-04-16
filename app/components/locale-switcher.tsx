"use client";

import { useTranslations } from "next-intl";
import { setLocale } from "@/modules/i18n/actions";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("settings");

  return (
    <div className="field-group">
      <span className="field-label">{t("appLanguage")}</span>
      <form action={setLocale} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          name="locale"
          defaultValue={currentLocale}
          className="select"
          style={{ maxWidth: 200 }}
          onChange={(e) => {
            const form = e.currentTarget.closest("form") as HTMLFormElement;
            form.requestSubmit();
          }}
        >
          <option value="auto">{t("languageOptions.auto")}</option>
          <option value="en">{t("languageOptions.en")}</option>
          <option value="es">{t("languageOptions.es")}</option>
          <option value="pt">{t("languageOptions.pt")}</option>
        </select>
      </form>
      <span className="field-hint">{t("appLanguageHint")}</span>
    </div>
  );
}
