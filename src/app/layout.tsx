import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

import CookiesBanner from "@/components/cookies-banner";
import PwaRegister from "@/components/pwa-register";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
};

export const metadata: Metadata = {
  title: "Cotizador Pro | Eventos Prime Tecnología",
  description: "Sistema profesional de generación de cotizaciones digitales",
  keywords: ["cotizaciones", "desarrollo web", "Eventos Prime", "tecnología"],
  authors: [{ name: "Eventos Prime Tecnología" }],
  icons: {
    icon: "/logo.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <PwaRegister />
        {children}
        <Toaster richColors position="top-right" />
        <CookiesBanner />
      </body>
    </html>
  );
}
