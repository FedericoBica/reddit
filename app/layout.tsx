import type { Metadata } from "next";
import { Outfit, Geist } from "next/font/google";
import { AgentationDev } from "./components/agentation-dev";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: { default: "ReddProwl", template: "%s — ReddProwl" },
  description: "Detectá intención de compra en Reddit y cerrá más ventas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        <AgentationDev />
      </body>
    </html>
  );
}
