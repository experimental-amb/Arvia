"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Eye, MessageCircle, PlusCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardTable } from "@/components/DashboardTable";
import { useAuth } from "@/lib/auth-context";
import { getDashboardProperties } from "@/services/api";
import type { Property } from "@/types/property";

const METRICS = [
  { icon: Building2, label: "Propiedades activas", value: "5", delta: "+2 este mes" },
  { icon: Eye, label: "Visualizaciones", value: "1 284", delta: "+18.2% vs sem. pasada" },
  { icon: MessageCircle, label: "Leads capturados", value: "27", delta: "+6 hoy" },
  { icon: TrendingUp, label: "Tasa conversión", value: "4.3%", delta: "estable" },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      setLoading(true);
      try {
        const items = await getDashboardProperties(user?.uid);
        setProperties(items);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user?.uid]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <div className="text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
            Panel
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            Hola{user ? `, ${user.displayName ?? user.email?.split("@")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tus propiedades, conversaciones del bot y métricas en un solo lugar.
          </p>
        </div>
        <Link href="/publish">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nueva propiedad
          </Button>
        </Link>
      </motion.div>

      {!user && !authLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-5 flex items-center gap-4 flex-wrap"
        >
          <div className="flex-1 min-w-[200px]">
            <div className="font-semibold">Modo invitado</div>
            <div className="text-xs text-muted-foreground">
              Estás viendo datos de demostración. Inicia sesión para gestionar tus
              propiedades reales.
            </div>
          </div>
          <Link href="/login">
            <Button variant="secondary">Iniciar sesión</Button>
          </Link>
        </motion.div>
      )}

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))]">
                <m.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-300">
                {m.delta}
              </span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight">{m.value}</div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Table */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tus publicaciones</h2>
          <Link href="/search" className="text-xs text-muted-foreground hover:text-foreground transition">
            Ver mercado →
          </Link>
        </div>
        <DashboardTable properties={properties} loading={loading} />
      </section>
    </div>
  );
}
