import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.SEOBOT_API_KEY;
  if (!apiKey || req.headers.get("x-api-key") !== apiKey) return unauthorized();

  const body = await req.json();
  const { title, slug, metaDescription, htmlContent, targetKeyword, wordCount, faqSchema, status } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title,
      slug,
      meta_description: metaDescription ?? null,
      content: htmlContent ?? null,
      target_keyword: targetKeyword ?? null,
      word_count: wordCount ?? null,
      faq_schema: faqSchema ?? null,
      status: status ?? "draft",
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({ id: data.id, url: `${siteUrl}/blog/${data.slug}` }, { status: 201 });
}
