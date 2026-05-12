"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const SUPPORTED = ["en", "es", "pt", "auto"] as const;

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "auto");
  const cookieStore = await cookies();

  if (locale === "auto") {
    cookieStore.delete("locale");
  } else if (SUPPORTED.includes(locale as (typeof SUPPORTED)[number])) {
    cookieStore.set("locale", locale, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const referer = (await headers()).get("referer");
  redirect(referer ?? "/settings");
}
