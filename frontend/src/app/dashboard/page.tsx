"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Eye, MessageCircle, PlusCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardTable } from "@/components/DashboardTable";
import { useAuth } from "@/lib/auth-context";
import { getDashboardProperties, getStats, type DashboardStats } from "@/services/api";
import type { Property } from "@/types/property";
import { BulkImportModal } from "@/components/BulkImportModal";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]         = useState(true);
  // T19: Estado para métricas reales del backend
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const items = await getDashboardProperties(user?.uid);
      setProperties(items);
    } finally {
      setLoading(false);
    }
  };

  // T19: Cargar métricas reales al montar el componente
  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch {
      // Silencioso: el dashboard sigue funcionando sin métricas
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchProperties();
    fetchStats();
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
        <div className="flex items-center gap-3">
          <BulkImportModal onSuccess={fetchProperties} />
          <Link href="/publish">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nueva propiedad
            </Button>
          </Link>
        </div>
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

      {/* T19: Métricas reales del backend (fallback a "—" mientras cargan) */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: Building2,
            label: "Propiedades publicadas",
            value: stats ? String(stats.publishedProperties) : "—",
            sub: stats ? `${stats.totalProperties} total` : "cargando…",
          },
          {
            icon: Eye,
            label: "Total propiedades",
            value: stats ? String(stats.totalProperties) : "—",
            sub: "en base de datos",
          },
          {
            icon: MessageCircle,
            label: "Leads capturados",
            value: stats ? String(stats.totalLeads) : "—",
            sub: "todos los canales",
          },
          {
            icon: TrendingUp,
            label: "Mensajes pendientes",
            value: stats ? String(stats.pendingMessages) : "—",
            sub: "en cola de procesamiento",
          },
        ].map((m, i) => (
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
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {m.sub}
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
