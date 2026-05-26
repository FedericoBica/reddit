import type { Metadata, Viewport } from "next";
import { Outfit, Instrument_Serif, Geist, Geist_Mono, IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AgentationDev } from "./components/agentation-dev";
import { PaddleProvider } from "@/components/paddle/paddle-provider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
  weight: "400",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-plex-serif",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://prowlit.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: "Prowlit", template: "%s — Prowlit" },
  description: "Find people on Reddit and X actively looking for what you sell. Prowlit scores buyer intent and helps you reply before your competitors do.",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    siteName: "Prowlit",
    title: "Prowlit — Find Buyers on Reddit & X",
    description: "Find people on Reddit and X actively looking for what you sell. Scores buyer intent, drafts human replies, ships in 2 minutes.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Prowlit" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prowlit — Find Buyers on Reddit & X",
    description: "Find people on Reddit and X actively looking for what you sell. Scores buyer intent, drafts human replies.",
    images: ["/opengraph-image.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${outfit.variable} ${instrumentSerif.variable} ${geist.variable} ${geistMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${ibmPlexSerif.variable} font-sans`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PaddleProvider>
            {children}
          </PaddleProvider>
          <AgentationDev />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
