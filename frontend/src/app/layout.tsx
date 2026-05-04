import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { AIAssistantButton } from "@/components/AIAssistantButton";
import { Toaster } from "@/components/ui/toaster";

const BASE_URL = "https://arvia-nu.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Arvia | Inteligencia Inmobiliaria con IA para Agencias",
    template: "%s | Arvia",
  },
  description:
    "Transforma tu inventario inmobiliario en una máquina de ventas con IA. Análisis de inversión, búsqueda semántica y omnicanalidad para agencias de alto rendimiento.",
  keywords: ["inmobiliaria", "inteligencia artificial", "propiedades", "real estate", "agencia inmobiliaria", "IA", "CRM inmobiliario"],
  authors: [{ name: "Arvia Tech" }],
  creator: "Arvia Tech",
  publisher: "Arvia Tech",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Arvia — Inteligencia Inmobiliaria con IA",
    description: "El asistente inmobiliario que conversa, analiza y vende contigo. Búsqueda semántica, WhatsApp IA y gestión de propiedades en un solo lugar.",
    type: "website",
    url: BASE_URL,
    siteName: "Arvia",
    locale: "es_CL",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Arvia — Inteligencia Inmobiliaria con IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arvia — Inteligencia Inmobiliaria con IA",
    description: "El asistente inmobiliario que conversa, analiza y vende contigo.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Arvia",
  url: BASE_URL,
  description:
    "SaaS inmobiliario con IA para agencias de alto rendimiento. Búsqueda semántica, agente WhatsApp y gestión masiva de propiedades.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "CLP",
    lowPrice: "0",
    highPrice: "29990",
    offerCount: "3",
  },
  provider: {
    "@type": "Organization",
    name: "Arvia Tech",
    url: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="pt-24">{children}</main>
          <AIAssistantButton />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
