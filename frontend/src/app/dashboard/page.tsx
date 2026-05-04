"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Building2, 
  Eye, 
  MessageCircle, 
  PlusCircle, 
  TrendingUp,
  Sparkles,
  Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardTable } from "@/components/DashboardTable";
import { useAuth } from "@/lib/auth-context";
import { 
  getDashboardProperties, 
  getStats, 
  togglePropertyStatus, 
  deleteProperty, 
  publishBulkProperties,
  type DashboardStats 
} from "@/services/api";
import type { Property } from "@/types/property";
import { BulkImportModal } from "@/components/BulkImportModal";
import { toast } from "@/hooks/use-toast";
import { SAMPLE_PROPERTIES } from "@/lib/sample-data";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const items = await getDashboardProperties(user?.uid);
      setProperties(items);
    } catch (err: any) {
      setFetchError(err?.message ?? "No se pudo cargar las propiedades. Verifica que n8n este activo.");
    } finally {
      setLoading(false);
    }
  };

  const loadSamples = async () => {
    if (!user) {
      toast({
        title: "Error de sesión",
        description: "Debes iniciar sesion para cargar datos.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingSamples(true);
    try {
      await publishBulkProperties(SAMPLE_PROPERTIES, user.uid);
      toast({
        title: "¡Éxito!",
        description: "Datos de muestra cargados con éxito.",
      });
      await refreshAll();
    } catch (err: any) {
      toast({
        title: "Error al cargar muestras",
        description: err?.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch {
      // silencioso
    }
  };

  const refreshAll = async () => {
    await Promise.allSettled([fetchProperties(), fetchStats()]);
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        title: "Error de sesión",
        description: "Debes iniciar sesion para eliminar propiedades.",
        variant: "destructive",
      });
      return;
    }
    try {
      await deleteProperty(id, user.uid);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      fetchStats();
      toast({
        title: "Propiedad eliminada",
        description: "La propiedad se ha eliminado correctamente.",
      });
    } catch (err: any) {
      toast({
        title: "Error al eliminar",
        description: err?.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    }
  };

  const handleEditSaved = async () => {
    await refreshAll();
    toast({
      title: "Actualizado",
      description: "Propiedad actualizada correctamente.",
    });
  };

  const handleToggleStatus = async (id: string, newStatus: "published" | "draft") => {
    if (!user) {
      toast({
        title: "Error de sesión",
        description: "Debes iniciar sesion para cambiar el estado.",
        variant: "destructive",
      });
      return;
    }
    try {
      await togglePropertyStatus(id, newStatus, user.uid);
      await refreshAll();
    } catch (err: any) {
      toast({
        title: "Error al cambiar estado",
        description: err?.message || "No se pudo actualizar el estado de la propiedad.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchProperties();
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid]);

  const statCards = [
    {
      icon: Building2,
      label: "Propiedades publicadas",
      value: stats ? String(stats.publishedProperties) : "-",
      sub: stats ? `${stats.totalProperties} total` : "cargando...",
    },
    {
      icon: Eye,
      label: "Total propiedades",
      value: stats ? String(stats.totalProperties) : "-",
      sub: "en base de datos",
    },
    {
      icon: MessageCircle,
      label: "Leads capturados",
      value: stats ? String(stats.totalLeads) : "-",
      sub: "todos los canales",
    },
    {
      icon: TrendingUp,
      label: "Mensajes pendientes",
      value: stats ? String(stats.pendingMessages) : "-",
      sub: "en cola",
    },
  ];

  const showEmptyState = !loading && properties.length === 0 && !fetchError;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-4"
      >
        <div>
          <div className="text-xs uppercase tracking-wider text-[hsl(var(--brand))]">Panel</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            {user ? `Hola, ${user.displayName ?? user.email?.split("@")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tus propiedades, conversaciones del bot y metricas en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BulkImportModal onSuccess={refreshAll} />
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
              Inicia sesion para gestionar tus propiedades reales.
            </div>
          </div>
          <Link href="/login">
            <Button variant="secondary">Iniciar sesion</Button>
          </Link>
        </motion.div>
      )}

      {/* Metricas */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((m, i) => (
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
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.sub}</span>
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight">{m.value}</div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </motion.div>
        ))}
      </section>

      {fetchError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Error: </span>
            {fetchError}
            <button onClick={fetchProperties} className="ml-2 underline hover:no-underline">
              Reintentar
            </button>
          </div>
        </motion.div>
      )}

      {showEmptyState && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-3xl glass-card p-10 text-center border-dashed border-2 border-white/10"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
            <Sparkles size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">Tu inventario está vacío</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
            ¿Quieres ver cómo funciona Arvia? Carga 5 propiedades de muestra en un clic 
            y prueba la búsqueda inteligente de inmediato.
          </p>
          <Button 
            onClick={loadSamples} 
            disabled={isLoadingSamples}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoadingSamples ? (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 animate-spin" /> Procesando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Cargar datos de muestra
              </span>
            )}
          </Button>
        </motion.div>
      )}

      {!showEmptyState && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tus publicaciones</h2>
            <Link href="/search" className="text-xs text-muted-foreground hover:text-foreground transition">
              Ver mercado
            </Link>
          </div>
          <DashboardTable
            properties={properties}
            loading={loading}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onEditSaved={handleEditSaved}
          />
        </section>
      )}
    </div>
  );
}
