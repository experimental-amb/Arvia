"use client";

import Link from "next/link";
import { useState } from "react";
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
  onToggleStatus?: (id: string, newStatus: "published" | "draft") => Promise<void>;
}

// Normaliza el status de BD ("published") al display ("active")
function resolveStatus(s?: PropertyStatus): "published" | "draft" | "archived" | "sold" | "reserved" {
  if (!s) return "published";
  if (s === "active") return "published";
  return s as any;
}

const STATUS_META: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "secondary" }> = {
  published: { label: "Publicada",  variant: "success"   },
  active:    { label: "Publicada",  variant: "success"   },
  draft:     { label: "Borrador",   variant: "secondary" },
  archived:  { label: "Archivada",  variant: "secondary" },
  reserved:  { label: "Reservada",  variant: "warning"   },
  sold:      { label: "Vendida",    variant: "danger"    },
};

/** Toggle switch visual — sin dependencia de shadcn/ui */
function StatusToggle({
  id,
  status,
  onChange,
}: {
  id: string;
  status: PropertyStatus | undefined;
  onChange: (id: string, next: "published" | "draft") => void;
}) {
  const resolved = resolveStatus(status);
  const isPublished = resolved === "published";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPublished}
      onClick={() => onChange(id, isPublished ? "draft" : "published")}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[hsl(var(--brand))] focus-visible:ring-offset-2",
        isPublished
          ? "bg-[hsl(var(--brand))]"
          : "bg-white/20",
      ].join(" ")}
      title={isPublished ? "Ocultar propiedad" : "Publicar propiedad"}
    >
      <span
        className={[
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm",
          "transition-transform duration-200",
          isPublished ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

export function DashboardTable({
  properties,
  loading = false,
  onToggleStatus,
}: DashboardTableProps) {
  // Estado local para actualizaciones optimistas del toggle
  const [localStatuses, setLocalStatuses] = useState<Record<string, PropertyStatus>>({});
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const getStatus = (p: Property): PropertyStatus | undefined =>
    localStatuses[p.id] ?? p.status;

  const handleToggle = async (id: string, next: "published" | "draft") => {
    if (!onToggleStatus || togglingIds.has(id)) return;

    const prev = getStatus(properties.find((p) => p.id === id)!) ?? "published";

    // Actualización optimista
    setLocalStatuses((s) => ({ ...s, [id]: next }));
    setTogglingIds((s) => new Set(s).add(id));

    try {
      await onToggleStatus(id, next);
    } catch {
      // Revertir si falla
      setLocalStatuses((s) => ({ ...s, [id]: prev as PropertyStatus }));
    } finally {
      setTogglingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

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
              <th className="text-center font-medium px-2 py-3">Visible</th>
              <th className="text-left font-medium px-2 py-3">Precio</th>
              <th className="text-left font-medium px-2 py-3">Sup.</th>
              <th className="text-right font-medium px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p, i) => {
              const status = getStatus(p);
              const meta = STATUS_META[resolveStatus(status)] ?? STATUS_META.published;
              const toggling = togglingIds.has(p.id);

              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 overflow-hidden rounded-lg border border-white/10 bg-white/5 shrink-0">
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                            —
                          </div>
                        )}
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
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </td>

                  <td className="px-2 py-3 text-center">
                    <div className={`flex justify-center ${toggling ? "opacity-50 pointer-events-none" : ""}`}>
                      <StatusToggle
                        id={p.id}
                        status={status}
                        onChange={handleToggle}
                      />
                    </div>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden divide-y divide-white/5">
        {properties.map((p) => {
          const status = getStatus(p);
          const meta = STATUS_META[resolveStatus(status)] ?? STATUS_META.published;
          const toggling = togglingIds.has(p.id);

          return (
            <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.03] transition">
              <Link href={`/property/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-14 w-20 overflow-hidden rounded-lg border border-white/10 shrink-0 bg-white/5">
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="text-xs text-muted-foreground">{p.comuna}</span>
                  </div>
                  <div className="mt-1 line-clamp-1 font-medium text-sm">{p.title}</div>
                  <div className="mt-0.5 text-xs text-[hsl(var(--brand))]">
                    {formatPrice(p.price, p.currency)}
                  </div>
                </div>
              </Link>
              {/* Toggle en móvil */}
              <div className={toggling ? "opacity-50 pointer-events-none" : ""}>
                <StatusToggle id={p.id} status={status} onChange={handleToggle} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
