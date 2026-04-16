"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = sanitizeNextPath(String(formData.get("next") ?? "/dashboard"));

  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Ingresá tu email")}&next=${encodeURIComponent(next)}`);
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://127.0.0.1:3000";
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: false,
    },
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("No encontramos una cuenta con ese email. Creá una cuenta primero.")}&next=${encodeURIComponent(next)}`,
    );
  }

  redirect(
    `/login?sent=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`,
  );
}

export async function verifyLoginCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim().replace(/\s/g, "");
  const next = sanitizeNextPath(String(formData.get("next") ?? "/dashboard"));

  if (!email || !token) {
    redirect(
      `/login?sent=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}&error=${encodeURIComponent("Ingresá el código que recibiste por email")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    redirect(
      `/login?sent=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}&error=${encodeURIComponent("El código no es válido o expiró")}`,
    );
  }

  redirect(next);
}

export async function signInWithGoogle(formData: FormData) {
  const next = sanitizeNextPath(String(formData.get("next") ?? "/dashboard"));
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`,
    );
  }

  if (!data.url) {
    redirect(
      `/login?error=${encodeURIComponent("No pudimos iniciar Google OAuth.")}&next=${encodeURIComponent(next)}`,
    );
  }

  redirect(data.url);
}

export async function requestSignUpCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect(`/signup?error=${encodeURIComponent("Ingresá tu email")}`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/signup?sent=1&email=${encodeURIComponent(email)}`);
}

export async function verifySignUpCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const token = String(formData.get("token") ?? "").trim().replace(/\s/g, "");

  if (!email || !token) {
    redirect(
      `/signup?sent=1&email=${encodeURIComponent(email)}&error=${encodeURIComponent("Ingresá el código que recibiste por email")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    redirect(
      `/signup?sent=1&email=${encodeURIComponent(email)}&error=${encodeURIComponent("El código no es válido o expiró")}`,
    );
  }

  redirect("/signup/company");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function sanitizeNextPath(next: string) {
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
