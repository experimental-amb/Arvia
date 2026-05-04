import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Uso",
  description: "Términos y condiciones de uso de la plataforma Arvia — inteligencia inmobiliaria con IA.",
  alternates: { canonical: "https://arvia-nu.vercel.app/terminos" },
};

export default function TerminosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Términos de Uso</h1>
      <p className="text-muted-foreground text-sm mb-12">Última actualización: mayo 2026</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Aceptación de los términos</h2>
          <p>
            Al acceder y utilizar Arvia, aceptas quedar vinculado por estos Términos de Uso. Si no estás de
            acuerdo con alguno de estos términos, no debes utilizar la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Descripción del servicio</h2>
          <p>
            Arvia es una plataforma SaaS de inteligencia inmobiliaria que permite a agencias y agentes gestionar
            inventarios de propiedades, automatizar búsquedas con IA y conectar con clientes mediante canales
            como WhatsApp e Instagram.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Uso aceptable</h2>
          <p>
            Te comprometes a utilizar Arvia únicamente para fines legales y de acuerdo con estos términos. Está
            prohibido usar la plataforma para actividades fraudulentas, envío de spam o cualquier actividad que
            infrinja leyes aplicables.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Propiedad intelectual</h2>
          <p>
            Todo el contenido, diseño y código de Arvia son propiedad de Arvia Tech. Queda prohibida su
            reproducción sin autorización expresa por escrito.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Limitación de responsabilidad</h2>
          <p>
            Arvia no garantiza que el servicio sea ininterrumpido o libre de errores. En ningún caso Arvia Tech
            será responsable de daños indirectos, incidentales o consecuentes derivados del uso de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Contacto</h2>
          <p>
            Para consultas sobre estos términos, contáctanos a través del formulario en la{" "}
            <Link href="/#contacto" className="text-indigo-400 hover:underline">página principal</Link>.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5">
        <Link href="/" className="text-sm text-muted-foreground hover:text-white transition">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
