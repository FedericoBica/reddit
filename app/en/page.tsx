import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/server";
import LandingPage from "../landing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://redprowl.com";

export const metadata: Metadata = {
  title: "RedProwl — Find Buyers on Reddit & X",
  description: "Find people on Reddit and X actively looking for what you sell. RedProwl scores buyer intent and helps you reply authentically before your competitors do. Free trial, no credit card.",
  alternates: {
    canonical: `${APP_URL}/en`,
    languages: { en: `${APP_URL}/en`, es: `${APP_URL}/es`, pt: `${APP_URL}/pt` },
  },
  openGraph: {
    title: "RedProwl — Find Buyers on Reddit & X",
    description: "Find people on Reddit and X actively looking for what you sell. Scores buyer intent, drafts human replies, ships in 2 minutes.",
    url: `${APP_URL}/en`,
    locale: "en_US",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#org`,
      name: "RedProwl",
      url: APP_URL,
      logo: { "@type": "ImageObject", url: `${APP_URL}/icono-colors.png` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#app`,
      name: "RedProwl",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Reddit and X monitoring platform that scores buyer intent and generates authentic replies for B2B teams.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free trial available" },
      publisher: { "@id": `${APP_URL}/#org` },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Is this going to get my account banned?", acceptedAnswer: { "@type": "Answer", text: "The opposite is the goal. Guardrails enforce subreddit rules, cadence, and self-promo ratios." } },
        { "@type": "Question", name: "How is RedProwl different from F5Bot or Brand24?", acceptedAnswer: { "@type": "Answer", text: "Those tools alert you when a keyword appears. RedProwl scores intent, drafts replies, and gives your team a shared workflow." } },
        { "@type": "Question", name: "Do you use my data to train AI models?", acceptedAnswer: { "@type": "Answer", text: "No. Replies, threads, and ICPs stay in your workspace unless you explicitly opt in." } },
        { "@type": "Question", name: "Can I use RedProwl for cold DMs?", acceptedAnswer: { "@type": "Answer", text: "Yes, but public replies consistently convert better and keep your account healthier." } },
      ],
    },
  ],
};

export default async function EnPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage locale="en" />
    </>
  );
}
