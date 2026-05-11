import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolvePostAuthPath } from "@/modules/auth/post-auth";
import { getCurrentUser } from "@/modules/auth/server";

export default async function Page() {
  const user = await getCurrentUser();
  if (user) redirect(await resolvePostAuthPath("/dashboard"));

  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") ?? "";
  const primary = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();

  if (primary === "es") redirect("/es");
  redirect("/en");
}
