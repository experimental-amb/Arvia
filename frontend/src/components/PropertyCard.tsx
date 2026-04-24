"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bath, Bed, MapPin, Ruler, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatSqm, cn } from "@/lib/utils";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
  index?: number;
  className?: string;
}

export function PropertyCard({ property, index = 0, className }: PropertyCardProps) {
  const p = property;
  const cover = p.images?.[0] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.6), ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl shadow-soft",
        className,
      )}
    >
      <Link href={`/property/${p.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={p.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* AI highlight */}
          {p.aiSummary && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 backdrop-blur px-2.5 py-1 text-[11px] text-white/90">
              <Sparkles className="h-3 w-3 text-[hsl(var(--brand))]" />
              IA destacada
            </div>
          )}

          {p.status && p.status !== "active" && (
            <div className="absolute right-3 top-3">
              <Badge
                variant={
                  p.status === "sold"
                    ? "danger"
                    : p.status === "reserved"
                    ? "warning"
                    : "secondary"
                }
              >
                {p.status === "sold"
                  ? "Vendida"
                  : p.status === "reserved"
                  ? "Reservada"
                  : "Borrador"}
              </Badge>
            </div>
          )}

          {/* Bottom overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              <MapPin className="h-3 w-3" />
              {p.comuna}, {p.region}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 text-base font-semibold tracking-tight">
              {p.title}
            </h3>
            <div className="shrink-0 text-right">
              <div className="text-base font-semibold text-[hsl(var(--brand))]">
                {formatPrice(p.price, p.currency)}
              </div>
            </div>
          </div>

          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" /> {p.bedrooms} dorm
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" /> {p.bathrooms} baño
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" /> {formatSqm(p.sqm)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
