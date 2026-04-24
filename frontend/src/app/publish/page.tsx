"use client";

import { motion } from "framer-motion";
import { PublishForm } from "@/components/PublishForm";

export default function PublishPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
          Nueva publicación
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
          Publicar propiedad
        </h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
          Completa los 3 pasos. La IA redactará una descripción optimizada y
          sugerirá un precio de mercado basado en comparables.
        </p>
      </motion.div>

      <PublishForm />
    </div>
  );
}
