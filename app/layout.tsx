import type { Metadata } from "next";
import { Outfit, Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AgentationDev } from "./components/agentation-dev";
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

export const metadata: Metadata = {
  title: { default: "ReddProwl", template: "%s — ReddProwl" },
  description: "Detect buying intent on Reddit and close more sales.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${outfit.variable} ${instrumentSerif.variable} ${geist.variable} ${geistMono.variable} font-sans`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <AgentationDev />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
