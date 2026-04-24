"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyDetail } from "@/components/PropertyDetail";
import { getProperty } from "@/services/api";
import type { Property } from "@/types/property";

export default function PropertyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = await getProperty(params.id);
        if (cancelled) return;
        if (!p) setNotFound(true);
        else setProperty(p);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Button>
      </div>

      {loading && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr,1fr]">
          <div className="space-y-4">
            <Skeleton className="aspect-[16/10] w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      )}

      {!loading && notFound && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <h2 className="text-xl font-semibold">Propiedad no encontrada</h2>
          <p className="text-sm text-muted-foreground mt-1">
            El ID <code className="font-mono">{params.id}</code> no existe o fue retirado.
          </p>
          <Link href="/search" className="inline-block mt-4">
            <Button>Volver a buscar</Button>
          </Link>
        </div>
      )}

      {!loading && property && <PropertyDetail property={property} />}
    </div>
  );
}
