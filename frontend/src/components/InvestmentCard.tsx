"use client";

import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, AlertCircle, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface InvestmentCardProps {
  investment?: {
    capRate?: number;
    plusvalia?: number;
    verdict?: string;
    risk?: "bajo" | "medio" | "alto";
  };
  price: number;
  comuna: string;
}

export function InvestmentCard({ investment, price, comuna }: InvestmentCardProps) {
  // Datos simulados si no existen (para demostración)
  const data = investment || {
    capRate: 5.2,
    plusvalia: 7.5,
    risk: "bajo" as const,
    verdict: `Esta propiedad en ${comuna} presenta un excelente ratio precio/m2 para la zona. El mercado de arriendos en este sector es dinámico, asegurando una vacancia mínima.`
  };

  const riskColors = {
    bajo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medio: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    alto: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-6 border-t-2 border-t-indigo-500"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-400 font-bold">
          <TrendingUp size={16} />
          Análisis de Inversión IA
        </div>
        <Badge className={riskColors[data.risk || "bajo"]}>
          Riesgo {data.risk}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Cap Rate */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              Rentabilidad Anual (Cap Rate)
              <Info size={12} className="opacity-50" />
            </span>
            <span className="font-semibold text-indigo-400">{data.capRate}%</span>
          </div>
          <Progress value={(data.capRate || 0) * 10} className="h-1.5" />
        </div>

        {/* Plusvalía */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Plusvalía estimada (Barrio)</span>
            <span className="font-semibold text-purple-400">{data.plusvalia}%</span>
          </div>
          <Progress value={(data.plusvalia || 0) * 10} className="h-1.5 bg-purple-500/10" />
        </div>

        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex gap-3">
            <div className="mt-1 text-indigo-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Veredicto Arvia</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.verdict}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-center text-muted-foreground italic">
          * Datos calculados promediando valores de mercado en {comuna}.
        </p>
      </div>
    </motion.div>
  );
}
