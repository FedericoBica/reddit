import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.SEOBOT_API_KEY;
  if (!apiKey || req.headers.get("x-api-key") !== apiKey) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      title: body.title,
      content: body.htmlContent,
      meta_description: body.metaDescription,
      target_keyword: body.targetKeyword,
      word_count: body.wordCount,
      faq_schema: body.faqSchema,
      status: body.status,
      published_at:
        body.status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({ id: data.id, url: `${siteUrl}/blog/${data.slug}` });
}
