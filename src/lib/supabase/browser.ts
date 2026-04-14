"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/schemas/database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

function requirePublicEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
