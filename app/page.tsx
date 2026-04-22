import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server";
import LandingPage from "./landing";

export default async function Page() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <LandingPage />;
}
