import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-10 text-center max-w-md w-full">
        <div className="text-6xl font-semibold text-gradient">404</div>
        <h1 className="mt-2 text-xl font-semibold">Página no encontrada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La ruta que buscas no existe o fue movida.
        </p>
        <Link href="/" className="inline-block mt-6">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
