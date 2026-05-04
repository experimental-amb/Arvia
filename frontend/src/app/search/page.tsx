"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Search as SearchIcon, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PropertyGrid } from "@/components/PropertyGrid";
import { FilterSidebar } from "@/components/FilterSidebar";
import { searchProperties } from "@/services/api";
import type { SearchFilters, SearchResult } from "@/types/property";

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const qParam = params.get("q") ?? "";

  const [input, setInput] = useState(qParam);
  const [filters, setFilters] = useState<SearchFilters>({ q: qParam });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(async (f: SearchFilters) => {
    setLoading(true);
    try {
      const r = await searchProperties(f);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setFilters({ q: qParam });
    setInput(qParam);
    run({ q: qParam });
  }, [qParam, run]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    const next = { ...filters, q };
    setFilters(next);
    router.replace(`/search?q=${encodeURIComponent(q)}`);
    run(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
          Resultados inteligentes
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
          {qParam ? `"${qParam}"` : "Explora propiedades"}
        </h1>
      </motion.div>

      {/* Search bar */}
      <form onSubmit={submit} className="mb-6">
        <div className="glass-strong rounded-2xl p-2 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-3">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Refina tu búsqueda…"
              className="bg-transparent border-0 focus-visible:ring-0 h-10 px-0"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </div>
      </form>

      {/* AI summary */}
      {result?.aiSummary && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4 mb-6 flex gap-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--brand))]/15 text-[hsl(var(--brand))] shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
              Análisis Arvia
            </div>
            <p className="text-sm mt-1 text-foreground/90">{result.aiSummary}</p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-[280px,1fr] gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <FilterSidebar
            value={filters}
            onChange={setFilters}
            onApply={() => run(filters)}
          />
        </aside>

        {/* Mobile Filter Trigger */}
        <div className="lg:hidden flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {loading
              ? "Buscando…"
              : `${result?.total ?? 0} propiedad${(result?.total ?? 0) === 1 ? "" : "es"}`}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-white/10 bg-white/5">
                <Filter className="h-3.5 w-3.5" /> Filtros
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-white/10 bg-black/95 backdrop-blur-2xl p-0">
              <div className="p-6 overflow-y-auto h-full pb-24">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filtros de búsqueda</SheetTitle>
                </SheetHeader>
                <FilterSidebar
                  value={filters}
                  onChange={setFilters}
                  onApply={() => run(filters)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <section>
          <div className="hidden lg:flex mb-4 items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {loading
                ? "Buscando…"
                : `${result?.total ?? 0} propiedad${(result?.total ?? 0) === 1 ? "" : "es"}`}
            </div>
          </div>

          <PropertyGrid
            properties={result?.items ?? []}
            loading={loading}
            emptyMessage="Sin resultados. Prueba relajar los filtros o cambia el texto de búsqueda."
          />
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">
          Cargando…
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
