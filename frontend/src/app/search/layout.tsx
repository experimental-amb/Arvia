import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buscar Propiedades",
  description:
    "Busca propiedades con inteligencia artificial. Describe lo que buscas en lenguaje natural y Arvia encontrará las mejores opciones para ti.",
  alternates: { canonical: "https://arvia-nu.vercel.app/search" },
  openGraph: {
    title: "Buscar Propiedades | Arvia",
    description:
      "Búsqueda semántica de propiedades con IA. Encuentra casas, departamentos y locales describiendo tu estilo de vida.",
    url: "https://arvia-nu.vercel.app/search",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
