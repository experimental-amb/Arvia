"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Building2, 
  Sparkles, 
  TrendingUp, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Search,
  CheckCircle2
} from "lucide-react";
import { HeroSearch } from "@/components/HeroSearch";
import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/ContactForm";
import { mockProperties } from "@/lib/mock-data";

const featured = mockProperties.slice(0, 3);

const steps = [
  {
    title: "Conecta tus Datos",
    desc: "Sube tu inventario mediante CSV, Excel o conexión directa. Nuestra IA normaliza todo al instante.",
    icon: Zap
  },
  {
    title: "IA Inteligente",
    desc: "Tu propio modelo de lenguaje entiende descripciones complejas y analiza el mercado por ti.",
    icon: Sparkles
  },
  {
    title: "Cierra más Rápido",
    desc: "Responde consultas en segundos y entrega reportes de inversión automáticos a tus clientes.",
    icon: TrendingUp
  }
];

const features = [
  {
    icon: Search,
    title: "Búsqueda Humana",
    body: "Encuentra propiedades describiendo el estilo de vida, no solo filtros. 'Casa moderna cerca de colegios con mucha luz'.",
  },
  {
    icon: ShieldCheck,
    title: "Validación de Datos",
    body: "Adiós a los errores de tipografía o precios irreales. El sistema limpia y valida cada registro automáticamente.",
  },
  {
    icon: MessageSquare,
    title: "Omnicanalidad",
    body: "Tus clientes pueden consultar vía WhatsApp, Telegram o Web. La IA mantiene el contexto en todos lados.",
  },
  {
    icon: Building2,
    title: "Gestión Masiva",
    body: "Soporta miles de propiedades con latencia mínima. Diseñado para agencias que quieren escalar.",
  },
];

const plans = [
  { name: "Starter", price: "Gratis", features: ["Hasta 10 propiedades", "Búsqueda IA básica", "Soporte vía email"], cta: "Empezar gratis", popular: false },
  { name: "Pro", price: "$29.990", period: "/mes", features: ["Propiedades ilimitadas", "Agente Telegram/WhatsApp", "Análisis de inversión IA"], cta: "Prueba 14 días", popular: true },
  { name: "Business", price: "Custom", features: ["API Acceso total", "Modelo IA dedicado", "Onboarding personalizado"], cta: "Contactar ventas", popular: false },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm mb-8"
          >
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-muted-foreground">Arvia v2.1.1 — La nueva era inmobiliaria</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Vende más rápido con <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Inteligencia Real Estate
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Arvia es el primer SaaS modular que transforma tu base de datos de propiedades 
            en un agente de ventas inteligente disponible 24/7.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-4xl mx-auto glass-card p-2 rounded-2xl"
          >
            <HeroSearch />
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-4 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">De maqueta a producción en 3 pasos</h2>
            <p className="text-muted-foreground">Automatizamos la parte difícil para que te centres en cerrar tratos.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-8 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                  <step.icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                No es un buscador,<br /> es un asistente.
              </h2>
              <div className="space-y-6">
                {features.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="mt-1 text-indigo-400"><f.icon size={20} /></div>
                    <div>
                      <h4 className="font-semibold mb-1">{f.title}</h4>
                      <p className="text-sm text-muted-foreground">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 overflow-hidden flex items-center justify-center">
                <Building2 size={120} className="text-indigo-500/30 animate-pulse" />
              </div>
              <div className="absolute -bottom-6 -left-6 glass-card p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">IA Analizando: 150 propiedades cargadas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-16">Planes para cada etapa</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] uppercase tracking-widest py-1 px-3 rounded-full font-bold">
                    Más Popular
                  </span>
                )}
                <h3 className="text-lg font-medium mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-6">
                  {plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="text-left space-y-4 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={14} className="text-indigo-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.popular ? "default" : "secondary"} className="w-full">
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-4 bg-indigo-600/5">
        <div className="max-w-4xl mx-auto">
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="text-indigo-500" />
            <span className="font-bold text-xl tracking-tight">ARVIA</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-white transition">Términos</Link>
            <Link href="#" className="hover:text-white transition">Privacidad</Link>
            <Link href="#" className="hover:text-white transition">Documentación</Link>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Arvia Tech. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
