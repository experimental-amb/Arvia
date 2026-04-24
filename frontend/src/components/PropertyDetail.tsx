"use client";

import { motion } from "framer-motion";
import {
  Bath,
  Bed,
  Calendar,
  MapPin,
  MessageCircle,
  Ruler,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageCarousel } from "./ImageCarousel";
import type { Property } from "@/types/property";
import { formatPrice, formatSqm } from "@/lib/utils";

interface PropertyDetailProps {
  property: Property;
}

export function PropertyDetail({ property: p }: PropertyDetailProps) {
  const whatsappMessage = encodeURIComponent(
    `Hola, estoy interesado en la propiedad "${p.title}" (${p.id}) publicada en InitCore.`,
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="grid gap-6 lg:grid-cols-[1.5fr,1fr]"
    >
      <div className="space-y-4">
        <ImageCarousel images={p.images} alt={p.title} />

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {p.address ? `${p.address} · ` : ""}{p.comuna}, {p.region}
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
                {p.title}
              </h1>
              {p.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="text-3xl font-semibold text-gradient">
                {formatPrice(p.price, p.currency)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Precio de lista</div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat icon={<Bed className="h-4 w-4" />} label="Dormitorios" value={p.bedrooms} />
            <Stat icon={<Bath className="h-4 w-4" />} label="Baños" value={p.bathrooms} />
            <Stat icon={<Ruler className="h-4 w-4" />} label="Superficie" value={formatSqm(p.sqm)} />
          </div>

          <Separator className="my-6" />

          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Descripción
          </h2>
          <p className="mt-2 leading-relaxed text-foreground/90 whitespace-pre-line">
            {p.description}
          </p>
        </div>
      </div>

      {/* Sticky sidebar */}
      <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
        {p.aiSummary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
              <Sparkles className="h-3.5 w-3.5" />
              Análisis InitCore
            </div>
            <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{p.aiSummary}</p>
          </motion.div>
        )}

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold">Agenda una visita</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Coordina con el corredor en menos de 2 minutos.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button className="w-full gap-2">
              <Calendar className="h-4 w-4" />
              Agendar visita
            </Button>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" className="w-full gap-2">
                <MessageCircle className="h-4 w-4" />
                Consultar por WhatsApp
              </Button>
            </a>
            <Button variant="ghost" className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              Compartir
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold">Simulador de dividendo</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimación en pesos a 25 años, tasa referencial 4.3%.
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">
              {formatPrice(estimateMonthly(p.price))}
            </span>
            <span className="text-xs text-muted-foreground">/mes aprox.</span>
          </div>
        </div>
      </aside>
    </motion.article>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-center text-[hsl(var(--brand))]">{icon}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function estimateMonthly(principal: number) {
  const rate = 0.043 / 12;
  const n = 25 * 12;
  const pi = (principal * rate) / (1 - Math.pow(1 + rate, -n));
  return Math.round(pi);
}
