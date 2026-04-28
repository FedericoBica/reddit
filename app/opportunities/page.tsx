import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<{ projectId?: string; leadId?: string; page?: string }>;
};

export default async function OpportunitiesRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const p = new URLSearchParams();
  p.set("type", "opportunities");
  if (params?.projectId) p.set("projectId", params.projectId);
  if (params?.leadId) { p.set("itemId", params.leadId); p.set("itemType", "opportunity"); }
  if (params?.page) p.set("page", params.page);
  redirect(`/feed?${p.toString()}`);
}
