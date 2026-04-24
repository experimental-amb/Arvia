import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/Navbar";
import { AIAssistantButton } from "@/components/AIAssistantButton";

export const metadata: Metadata = {
  title: "Arvia — Tu agente inmobiliario con IA",
  description:
    "Busca, publica y analiza propiedades con un asistente inteligente. Arvia combina datos, conversación y acción en una sola experiencia.",
  metadataBase: new URL("https://arvia.ai"),
  openGraph: {
    title: "Arvia — AI Real Estate",
    description: "El asistente inmobiliario que conversa, filtra y decide contigo.",
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
        </AuthProvider>
      </body>
    </html>
  );
}
