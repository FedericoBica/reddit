import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PostMeta = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  targetKeyword: string | null;
};

export type Post = PostMeta & {
  content: string;
};

export async function listPosts(): Promise<PostMeta[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, slug, title, meta_description, published_at, target_keyword")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.meta_description ?? "",
    date: row.published_at ?? "",
    targetKeyword: row.target_keyword,
  }));
}

export async function getPost(slug: string): Promise<Post | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("id, slug, title, meta_description, content, published_at, target_keyword")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return null;

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.meta_description ?? "",
    date: data.published_at ?? "",
    targetKeyword: data.target_keyword,
    content: data.content ?? "",
  };
}
