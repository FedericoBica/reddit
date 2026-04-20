import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { ValidatedWebsite } from "@/modules/onboarding/url-validation";

const WEBSITE_TEXT_TIMEOUT_MS = 10_000;
const MAX_WEBSITE_TEXT_CHARS = 18_000;

const companyAnalysisSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  description: z.string().trim().min(20).max(900),
});

export type CompanyAnalysis = z.infer<typeof companyAnalysisSchema>;

export async function analyzeCompanyWithAI(
  website: ValidatedWebsite,
): Promise<CompanyAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackAnalysis(website);
  }

  const websiteText = await fetchWebsiteText(website.url);
  const model =
    process.env.OPENAI_COMPANY_ANALYSIS_MODEL ??
    process.env.OPENAI_MODEL ??
    "gpt-4o-mini";
  const temperature = Number(
    process.env.OPENAI_COMPANY_ANALYSIS_TEMPERATURE ?? "0.2",
  );
  const timeoutMs = Number(
    process.env.OPENAI_COMPANY_ANALYSIS_TIMEOUT_MS ?? "30000",
  );
  const client = new OpenAI({ apiKey, timeout: timeoutMs });

  const contextLines = [
    `Website URL: ${website.url}`,
    `Hostname: ${website.hostname}`,
  ];
  if (websiteText.length >= 40) {
    contextLines.push("Website text:", websiteText);
  } else {
    contextLines.push(
      "Note: website content could not be extracted (likely a JS-heavy SPA or bot protection).",
      "Infer the company type from the URL and hostname only.",
    );
  }

  try {
    const response = await client.responses.parse(
      {
        model,
        temperature,
        instructions: [
          "You analyze a company website for a Reddit lead monitoring onboarding flow.",
          "Infer from the website text or, if unavailable, from the URL/hostname alone.",
          "Do not invent specific customers, features, numbers, or claims you cannot infer.",
          "Write the description in Spanish (2-4 sentences), but keep product/category names as-is.",
          "Describe: what the company does, who it helps, core use cases, and the buyer pains to watch for on Reddit.",
        ].join(" "),
        input: contextLines.join("\n"),
        max_output_tokens: 600,
        text: {
          format: zodTextFormat(companyAnalysisSchema, "company_website_analysis"),
        },
      },
      { timeout: timeoutMs },
    );

    const parsed = response.output_parsed;
    if (parsed) return parsed;
  } catch {
    // AI call failed — fall through to fallback
  }

  return fallbackAnalysis(website);
}

function fallbackAnalysis(website: ValidatedWebsite): CompanyAnalysis {
  const name = website.hostname
    .replace(/\.[a-z]{2,}$/i, "")
    .split(/[.-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

  return {
    companyName: name || website.hostname,
    description: `${name || website.hostname} es una empresa digital que ayuda a sus clientes a resolver un problema específico con su producto o servicio. ReddProwl buscará en Reddit conversaciones con intención de compra, pedidos de recomendaciones y comparaciones relevantes para este negocio.`,
  };
}

/** Returns extracted text, or empty string if the site is unreachable / JS-only. */
export async function fetchWebsiteText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBSITE_TEXT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.5",
        "user-agent": "Mozilla/5.0 (compatible; ReddProwl-bot/1.0)",
      },
    });

    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();
    const text = contentType.includes("html") ? htmlToText(rawText) : normalizeText(rawText);

    return text.slice(0, MAX_WEBSITE_TEXT_CHARS);
  } catch {
    // Network error, timeout, bot-blocked, etc. — return empty so caller decides.
    return "";
  } finally {
    clearTimeout(timeout);
  }
}

function htmlToText(html: string) {
  const title = matchMeta(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = matchMeta(
    html,
    /<meta\s+[^>]*(?:name|property)=["'](?:description|og:description)["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  );
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  return normalizeText([title, description, body].filter(Boolean).join(" "));
}

function matchMeta(html: string, pattern: RegExp) {
  return decodeEntities(pattern.exec(html)?.[1] ?? "");
}

function normalizeText(text: string) {
  return decodeEntities(text)
    .replace(/\s+/g, " ")
    .replace(/\b(cookie|privacy policy|terms of service)\b/gi, " ")
    .trim();
}

function decodeEntities(text: string) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}
