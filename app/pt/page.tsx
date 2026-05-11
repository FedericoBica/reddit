import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolvePostAuthPath } from "@/modules/auth/post-auth";
import { getCurrentUser } from "@/modules/auth/server";
import LandingPage from "../landing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prowlit.com";

export const metadata: Metadata = {
  title: "Prowlit — Encontre compradores no Reddit e no X",
  description: "Encontre pessoas no Reddit e no X buscando ativamente o que você vende. O Prowlit pontua a intenção de compra e te ajuda a responder antes dos seus concorrentes. Trial grátis, sem cartão.",
  alternates: {
    canonical: `${APP_URL}/pt`,
    languages: { en: `${APP_URL}/en`, es: `${APP_URL}/es`, pt: `${APP_URL}/pt` },
  },
  openGraph: {
    title: "Prowlit — Encontre compradores no Reddit e no X",
    description: "Encontre pessoas no Reddit e no X buscando o que você vende. Pontua intenção de compra, gera respostas humanas, funciona em 2 minutos.",
    url: `${APP_URL}/pt`,
    locale: "pt_BR",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#org`,
      name: "Prowlit",
      url: APP_URL,
      logo: { "@type": "ImageObject", url: `${APP_URL}/icono-colors.png` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#app`,
      name: "Prowlit",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "Plataforma de monitoramento do Reddit e X que pontua a intenção de compra e gera respostas autênticas para equipes B2B.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Trial gratuito disponível" },
      publisher: { "@id": `${APP_URL}/#org` },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Isso vai fazer minha conta ser banida?", acceptedAnswer: { "@type": "Answer", text: "O oposto é o objetivo. As proteções integradas aplicam as regras do subreddit, a cadência e os limites de autopromoção." } },
        { "@type": "Question", name: "Em que o Prowlit é diferente do F5Bot ou Brand24?", acceptedAnswer: { "@type": "Answer", text: "Essas ferramentas te avisam quando uma palavra-chave aparece. O Prowlit pontua a intenção, redige respostas e dá ao seu time um fluxo de trabalho compartilhado." } },
        { "@type": "Question", name: "Vocês usam meus dados para treinar modelos?", acceptedAnswer: { "@type": "Answer", text: "Não. Respostas, tópicos e ICPs ficam no seu espaço de trabalho, a menos que você opte explicitamente." } },
        { "@type": "Question", name: "Posso usar isso para DMs frios?", acceptedAnswer: { "@type": "Answer", text: "Sim, mas respostas públicas convertem consistentemente melhor e mantêm sua conta mais saudável." } },
      ],
    },
  ],
};

export default async function PtPage() {
  const user = await getCurrentUser();
  if (user) redirect(await resolvePostAuthPath("/dashboard"));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage locale="pt" />
    </>
  );
}
