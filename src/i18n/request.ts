import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const SUPPORTED = ["en", "es", "pt"] as const;
type Locale = (typeof SUPPORTED)[number];

export default getRequestConfig(async () => {
  const locale = await detectLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});

export async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const saved = cookieStore.get("locale")?.value;
  if (saved && SUPPORTED.includes(saved as Locale)) return saved as Locale;

  const headersList = await headers();
  const refererLocale = extractLocaleFromPath(headersList.get("referer"));
  if (refererLocale) return refererLocale;

  const acceptLanguage = headersList.get("accept-language") ?? "";
  const primary = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
  if (primary === "es") return "es";
  if (primary === "pt") return "pt";
  return "en";
}

export function normalizeLocale(value?: string | null): Locale | null {
  if (!value) return null;
  return SUPPORTED.includes(value as Locale) ? (value as Locale) : null;
}

function extractLocaleFromPath(value?: string | null): Locale | null {
  if (!value) return null;

  try {
    const pathname = new URL(value).pathname;
    const segment = pathname.split("/").filter(Boolean)[0];
    return normalizeLocale(segment);
  } catch {
    return null;
  }
}
