import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolvePostAuthPath } from "@/modules/auth/post-auth";
import { getCurrentUser } from "@/modules/auth/server";
import LandingPage from "../landing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prowlit.com";

export const metadata: Metadata = {
  title: "Prowlit — Encuentra compradores en Reddit y X",
  description: "Encuentra personas en Reddit y X que están buscando activamente lo que vendes. Prowlit puntúa la intención de compra y te ayuda a responder antes que tu competencia. Prueba gratis, sin tarjeta.",
  alternates: {
    canonical: `${APP_URL}/es`,
    languages: { en: `${APP_URL}/en`, es: `${APP_URL}/es`, pt: `${APP_URL}/pt` },
  },
  openGraph: {
    title: "Prowlit — Encuentra compradores en Reddit y X",
    description: "Encuentra personas en Reddit y X buscando lo que vendes. Puntúa intención de compra, genera respuestas humanas, funciona en 2 minutos.",
    url: `${APP_URL}/es`,
    locale: "es_ES",
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
      description: "Plataforma de monitoreo de Reddit y X que puntúa la intención de compra y genera respuestas auténticas para equipos B2B.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Prueba gratuita disponible" },
      publisher: { "@id": `${APP_URL}/#org` },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "¿Esto me va a hacer banear la cuenta?", acceptedAnswer: { "@type": "Answer", text: "Todo lo contrario. Las protecciones integradas aplican las reglas del subreddit, la cadencia y los límites de autopromoción." } },
        { "@type": "Question", name: "¿En qué se diferencia de F5Bot o Brand24?", acceptedAnswer: { "@type": "Answer", text: "Esas herramientas te avisan cuando aparece una palabra clave. Prowlit evalúa la intención, redacta respuestas y le da a tu equipo un flujo de trabajo compartido." } },
        { "@type": "Question", name: "¿Usáis mis datos para entrenar modelos?", acceptedAnswer: { "@type": "Answer", text: "No. Las respuestas, hilos e ICPs permanecen en tu espacio de trabajo salvo que des tu consentimiento explícito." } },
        { "@type": "Question", name: "¿Puedo usarlo para DMs en frío?", acceptedAnswer: { "@type": "Answer", text: "Sí, aunque las respuestas públicas convierten mejor de forma consistente y mantienen tu cuenta más saludable." } },
      ],
    },
  ],
};

export default async function EsPage() {
  const user = await getCurrentUser();
  if (user) redirect(await resolvePostAuthPath("/dashboard"));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage locale="es" />
    </>
  );
}
