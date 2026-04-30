import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server";
import LandingPage from "../landing";

export default async function EsPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <LandingPage locale="es" />;
}
