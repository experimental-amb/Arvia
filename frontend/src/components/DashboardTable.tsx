"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { Property, PropertyStatus } from "@/types/property";
import { formatPrice, formatSqm } from "@/lib/utils";

interface DashboardTableProps {
  properties: Property[];
  loading?: boolean;
}

const STATUS_META: Record<
  PropertyStatus,
  { label: string; variant: "default" | "success" | "warning" | "danger" | "secondary" }
> = {
  active: { label: "Activa", variant: "success" },
  draft: { label: "Borrador", variant: "secondary" },
  reserved: { label: "Reservada", variant: "warning" },
  sold: { label: "Vendida", variant: "danger" },
};

export function DashboardTable({ properties, loading = false }: DashboardTableProps) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!properties.length) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center text-sm text-muted-foreground">
        No tienes propiedades publicadas todavía. Ve a{" "}
        <Link href="/publish" className="text-[hsl(var(--brand))] hover:underline">
          Publicar
        </Link>{" "}
        para comenzar.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Desktop */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
            <tr>
              <th className="text-left font-medium px-6 py-3">Propiedad</th>
              <th className="text-left font-medium px-2 py-3">Comuna</th>
              <th className="text-left font-medium px-2 py-3">Estado</th>
              <th className="text-left font-medium px-2 py-3">Precio</th>
              <th className="text-left font-medium px-2 py-3">Superficie</th>
              <th className="text-right font-medium px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p, i) => (
              <motion.tr
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-14 overflow-hidden rounded-lg border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium line-clamp-1">{p.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.bedrooms} dorm · {p.bathrooms} baño
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3 text-muted-foreground">{p.comuna}</td>
                <td className="px-2 py-3">
                  <Badge variant={STATUS_META[p.status ?? "active"].variant}>
                    {STATUS_META[p.status ?? "active"].label}
                  </Badge>
                </td>
                <td className="px-2 py-3 font-medium">{formatPrice(p.price, p.currency)}</td>
                <td className="px-2 py-3 text-muted-foreground">{formatSqm(p.sqm)}</td>
                <td className="px-6 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/property/${p.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> Ver
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-300 focus:text-rose-200">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-white/5">
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/property/${p.id}`}
            className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition"
          >
            <div className="h-14 w-20 overflow-hidden rounded-lg border border-white/10 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_META[p.status ?? "active"].variant}>
                  {STATUS_META[p.status ?? "active"].label}
                </Badge>
                <span className="text-xs text-muted-foreground">{p.comuna}</span>
              </div>
              <div className="mt-1 line-clamp-1 font-medium text-sm">{p.title}</div>
              <div className="mt-0.5 text-xs text-[hsl(var(--brand))]">
                {formatPrice(p.price, p.currency)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
