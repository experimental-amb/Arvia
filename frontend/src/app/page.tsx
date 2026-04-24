"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Sparkles, TrendingUp, MessageSquare } from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { mockProperties } from "@/lib/mock-data";

const featured = mockProperties.slice(0, 3);

const features = [
  {
    icon: Sparkles,
    title: "Búsqueda en lenguaje natural",
    body: "Describe lo que buscas como se lo dirías a un humano. InitCore convierte tu intención en filtros SQL precisos.",
  },
  {
    icon: TrendingUp,
    title: "Análisis de inversión",
    body: "Cada ficha trae un veredicto IA: rentabilidad estimada, plusvalía del barrio y comparables.",
  },
  {
    icon: MessageSquare,
    title: "Agente 24/7 en Telegram",
    body: "Conversa con el bot en WhatsApp/Telegram y continúa desde la web. Mismo contexto, misma memoria.",
  },
  {
    icon: Building2,
    title: "Publica en 60 segundos",
    body: "Formulario corto + IA que redacta tu descripción y sugiere precio de mercado.",
  },
];

const stats = [
  { value: "12K+", label: "Propiedades indexadas" },
  { value: "340", label: "Corredores activos" },
  { value: "4.9★", label: "Rating usuarios" },
  { value: "<1s", label: "Latencia IA" },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-dark [background-size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-50"
      />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Nuevo · Wizard de búsqueda guiado por IA
          </motion.div>

          <h1 className="mt-6 text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.05]">
            Encuentra tu próxima propiedad <br />
            <span className="text-gradient">hablando con un agente IA</span>
          </h1>

          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            InitCore combina datos de mercado, conversación natural y acción concreta.
            Describe lo que buscas — nosotros hacemos el resto.
          </p>

          <div className="mt-10 w-full">
            <HeroSearch />
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Disponible en:</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5">Web</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5">Telegram</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5">WhatsApp</span>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl glass-card p-6"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-semibold text-gradient">
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
              Por qué InitCore
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
              Un asistente, no un buscador
            </h2>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass-card rounded-2xl p-5 hover:border-[hsl(var(--brand))]/40 transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured properties */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-end justify-between gap-4 flex-wrap"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
              Destacadas
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
              Selección curada por IA
            </h2>
          </div>
          <Link href="/search">
            <Button variant="secondary" className="gap-1">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl glass-card p-10 text-center"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(var(--brand)/0.25),transparent_60%)]"
          />
          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            ¿Tienes una propiedad para vender?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Publica en 60 segundos. La IA redacta la descripción, sugiere el precio
            y te conecta con interesados automáticamente.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/publish">
              <Button className="gap-2">
                Publicar ahora
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Ver dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-muted-foreground">
        InitCore © {new Date().getFullYear()} · Construido con Next.js, Tailwind y Ollama ·
        Agente inmobiliario conversacional
      </footer>
    </div>
  );
}
