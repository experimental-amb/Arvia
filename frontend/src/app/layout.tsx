import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { AIAssistantButton } from "@/components/AIAssistantButton";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Arvia | Inteligencia Inmobiliaria 24/7",
  description:
    "Transforma tu inventario inmobiliario en una máquina de ventas con IA. Análisis de inversión, búsqueda humana y omnicanalidad para agencias de alto rendimiento.",
  metadataBase: new URL("https://arvia.ai"),
  openGraph: {
    title: "Arvia — AI Real Estate Intelligence",
    description: "El asistente inmobiliario que conversa, analiza y vende contigo.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
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
