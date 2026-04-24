"use client";

import { motion } from "framer-motion";
import { PropertyCard } from "./PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property } from "@/types/property";

interface PropertyGridProps {
  properties: Property[];
  loading?: boolean;
  emptyMessage?: string;
}

export function PropertyGrid({
  properties,
  loading = false,
  emptyMessage = "No se encontraron propiedades.",
}: PropertyGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!properties.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-2xl p-10 text-center"
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p, i) => (
        <PropertyCard key={p.id} property={p} index={i} />
      ))}
    </div>
  );
}
