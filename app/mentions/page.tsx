import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{
    projectId?: string;
    mentionId?: string;
    target?: string;
    sentiment?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function MentionsRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const p = new URLSearchParams();
  p.set("type", "mentions");
  if (params?.projectId) p.set("projectId", params.projectId);
  if (params?.mentionId) { p.set("itemId", params.mentionId); p.set("itemType", "mention"); }
  if (params?.target) p.set("target", params.target);
  if (params?.sentiment) p.set("sentiment", params.sentiment);
  if (params?.sort) p.set("sort", params.sort);
  if (params?.page) p.set("page", params.page);
  redirect(`/feed?${p.toString()}`);
}
