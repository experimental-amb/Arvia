"use client";

import { motion } from "framer-motion";
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Plus, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Datos simulados basados en el kit de facturas
const stats = {
  totalIngresos: 27150.00,
  totalGastos: 649.99,
  beneficio: 26500.01,
  ivaRepercutido: 5701.50,
  ivaSoportado: 136.50,
  mediaMensual: 4525.00
};

const recentInvoices = [
  { id: "F-2026-005", client: "Boutique Mariposa SL", concept: "Tienda online Shopify", amount: 5830.00, type: "ingreso", date: "20/03/2026" },
  { id: "ADBE-26-03", client: "Adobe Systems", concept: "Adobe Creative Cloud", amount: 72.59, type: "gasto", date: "01/03/2026" },
  { id: "F-2026-004", client: "Tech Startup Innova", concept: "Rediseño dashboard", amount: 4028.00, type: "ingreso", date: "27/02/2026" },
  { id: "GOO-26-02", client: "Google Cloud", concept: "Google Workspace", amount: 28.31, type: "gasto", date: "08/02/2026" },
];

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold">Finanzas</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">Facturación y Gastos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tus comisiones y controla tus costos operativos.
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Exportar Reporte
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Subir Factura
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 border-l-4 border-l-emerald-500"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={20} />
            </div>
            <Badge variant="outline" className="text-emerald-400 border-emerald-500/20">
              +12% vs mes anterior
            </Badge>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">€{stats.totalIngresos.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">Ingresos totales (Neto)</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 border-l-4 border-l-rose-500"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">€{stats.totalGastos.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">Gastos operativos</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 border-l-4 border-l-indigo-500"
        >
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight text-white">€{stats.beneficio.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">Beneficio Neto</div>
          </div>
        </motion.div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Últimos movimientos</h2>
            <Button variant="ghost" size="sm" className="gap-2 text-xs">
              <Filter className="h-3 w-3" /> Filtrar
            </Button>
          </div>
          <div className="space-y-3">
            {recentInvoices.map((inv, i) => (
              <motion.div 
                key={inv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 rounded-xl flex items-center justify-between hover:border-white/10 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${inv.type === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-white group-hover:text-indigo-400 transition">{inv.client}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{inv.concept} · {inv.id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold flex items-center justify-end gap-1 ${inv.type === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {inv.type === 'ingreso' ? '+' : '-'}€{inv.amount.toLocaleString()}
                    {inv.type === 'ingreso' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{inv.date}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Sidebar Insights */}
        <aside className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Impuestos</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>IVA Repercutido (Cobrado)</span>
                  <span className="text-white font-medium">€{stats.ivaRepercutido}</span>
                </div>
                <Progress value={80} className="h-1 bg-white/5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>IVA Soportado (Pagado)</span>
                  <span className="text-white font-medium">€{stats.ivaSoportado}</span>
                </div>
                <Progress value={10} className="h-1 bg-white/5" />
              </div>
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm font-bold">
                  <span>A liquidar (Est.)</span>
                  <span className="text-indigo-400">€{(stats.ivaRepercutido - stats.ivaSoportado).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl bg-indigo-600/5 border-indigo-500/20">
            <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
              <TrendingUp size={16} /> Tip de Ahorro
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tus gastos en software representan el 2% de tus ingresos. Estás en un rango óptimo de eficiencia operativa.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
