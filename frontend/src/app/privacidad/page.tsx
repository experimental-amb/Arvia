import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y tratamiento de datos personales en la plataforma Arvia.",
  alternates: { canonical: "https://arvia-nu.vercel.app/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-muted-foreground text-sm mb-12">Última actualización: mayo 2026</p>

      <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Información que recopilamos</h2>
          <p>
            Recopilamos información que nos proporcionas directamente al registrarte, como nombre, correo
            electrónico y datos de la agencia. También recopilamos datos de uso de la plataforma de forma
            anónima para mejorar el servicio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Uso de la información</h2>
          <p>
            Utilizamos tu información para proveer y mejorar el servicio, enviarte comunicaciones relacionadas
            con tu cuenta y cumplir con obligaciones legales. No vendemos ni compartimos tus datos personales
            con terceros con fines comerciales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Almacenamiento y seguridad</h2>
          <p>
            Tus datos se almacenan en servidores seguros con cifrado en tránsito (HTTPS) y en reposo. Aplicamos
            medidas técnicas y organizativas para proteger tu información contra accesos no autorizados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Cookies</h2>
          <p>
            Arvia utiliza cookies esenciales para el funcionamiento de la sesión. No utilizamos cookies de
            seguimiento publicitario de terceros.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Tus derechos</h2>
          <p>
            Tienes derecho a acceder, rectificar y eliminar tus datos personales. Para ejercer estos derechos,
            contáctanos a través del formulario en la{" "}
            <Link href="/#contacto" className="text-indigo-400 hover:underline">página principal</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política periódicamente. Te notificaremos de cambios significativos mediante
            un aviso en la plataforma o por correo electrónico.
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
