import type { Metadata } from "next";
import { Outfit, Instrument_Serif } from "next/font/google";
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
    <html lang={locale} className={`${outfit.variable} ${instrumentSerif.variable} font-sans`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <AgentationDev />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
