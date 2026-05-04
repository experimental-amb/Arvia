import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  return {
    title: `Propiedad #${params.id}`,
    description:
      "Detalle de propiedad inmobiliaria en Arvia. Información completa, imágenes y contacto con el agente.",
    openGraph: {
      title: `Propiedad #${params.id} | Arvia`,
      description:
        "Consulta los detalles de esta propiedad en Arvia — inteligencia inmobiliaria con IA.",
      url: `https://arvia-nu.vercel.app/property/${params.id}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
