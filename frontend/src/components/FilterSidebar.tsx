"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import type { SearchFilters } from "@/types/property";
import { REGIONES_CHILE, getComunasByRegion } from "@/lib/chile-regiones";

interface FilterSidebarProps {
  value: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onApply: () => void;
}

export function FilterSidebar({ value, onChange, onApply }: FilterSidebarProps) {
  const [localMaxPrice, setLocalMaxPrice] = useState(value.maxPrice ?? 800_000_000);
  // Región seleccionada en el sidebar (independiente del SearchFilters para cascada)
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  useEffect(() => {
    setLocalMaxPrice(value.maxPrice ?? 800_000_000);
  }, [value.maxPrice]);

  const comunasDisponibles = selectedRegion ? getComunasByRegion(selectedRegion) : [];

  const handleRegionChange = (region: string) => {
    const val = region === "__all__" ? "" : region;
    setSelectedRegion(val);
    onChange({ ...value, region: val || undefined, comuna: undefined });
  };

  const handleComunaChange = (comuna: string) => {
    onChange({ ...value, comuna: comuna === "__all__" ? undefined : (comuna || undefined) });
  };

  const reset = () => {
    setSelectedRegion("");
    onChange({ q: value.q });
    setLocalMaxPrice(800_000_000);
  };

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-2xl p-5 space-y-5 h-fit lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-[hsl(var(--brand))]" />
          Filtros
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <Separator />

      {/* Selector Región */}
      <div className="space-y-2">
        <Label>Región</Label>
        <Select value={selectedRegion || "__all__"} onValueChange={handleRegionChange}>
          <SelectTrigger id="filter-region">
            <SelectValue placeholder="Todas las regiones" />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto">
            <SelectItem value="__all__">Todas las regiones</SelectItem>
            <SelectGroup>
              <SelectLabel>Zona Norte</SelectLabel>
              {REGIONES_CHILE.slice(0, 4).map((r) => (
                <SelectItem key={r.codigo} value={r.nombre}>
                  {r.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Zona Centro</SelectLabel>
              {REGIONES_CHILE.slice(4, 7).map((r) => (
                <SelectItem key={r.codigo} value={r.nombre}>
                  {r.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Zona Sur</SelectLabel>
              {REGIONES_CHILE.slice(7, 13).map((r) => (
                <SelectItem key={r.codigo} value={r.nombre}>
                  {r.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Zona Austral</SelectLabel>
              {REGIONES_CHILE.slice(13).map((r) => (
                <SelectItem key={r.codigo} value={r.nombre}>
                  {r.nombre}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Selector Comuna — filtrado según región */}
      <div className="space-y-2">
        <Label>Comuna</Label>
        <Select
          value={value.comuna || "__all__"}
          onValueChange={handleComunaChange}
          disabled={!selectedRegion}
        >
          <SelectTrigger id="filter-comuna">
            <SelectValue
              placeholder={selectedRegion ? "Todas las comunas" : "Primero elige una región"}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72 overflow-y-auto">
            <SelectItem value="__all__">Todas las comunas</SelectItem>
            {comunasDisponibles.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Dormitorios mín.</Label>
          <Select
            value={value.bedrooms?.toString() ?? ""}
            onValueChange={(v) =>
              onChange({ ...value, bedrooms: v ? Number(v) : undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Baños mín.</Label>
          <Select
            value={value.bathrooms?.toString() ?? ""}
            onValueChange={(v) =>
              onChange({ ...value, bathrooms: v ? Number(v) : undefined })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Cualquiera" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}+
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Precio máximo</Label>
          <span className="text-xs text-muted-foreground">
            ${(localMaxPrice / 1_000_000).toFixed(0)}M
          </span>
        </div>
        <Slider
          min={20_000_000}
          max={1_000_000_000}
          step={10_000_000}
          value={[localMaxPrice]}
          onValueChange={(v) => setLocalMaxPrice(v[0])}
          onValueCommit={(v) => onChange({ ...value, maxPrice: v[0] })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>m² mín.</Label>
          <Input
            type="number"
            placeholder="0"
            value={value.minSqm ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                minSqm: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>m² máx.</Label>
          <Input
            type="number"
            placeholder="∞"
            value={value.maxSqm ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                maxSqm: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      <Button onClick={onApply} className="w-full">
        Aplicar filtros
      </Button>
    </motion.aside>
  );
}
