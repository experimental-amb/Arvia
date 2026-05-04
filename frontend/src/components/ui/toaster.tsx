"use client";

import { useEffect } from "react";
import { useToastStore } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export function Toaster() {
  const { items, subscribe } = useToastStore();

  useEffect(() => {
    const unsub = subscribe();
    return unsub;
  }, [subscribe]);

  if (!items.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={[
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
            "pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300",
            t.type === "success" ? "bg-emerald-500/90 text-white" :
            t.type === "error"   ? "bg-rose-500/90 text-white" :
                                   "bg-[hsl(var(--brand))]/90 text-white",
          ].join(" ")}
        >
          {t.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
          {t.type === "error"   && <XCircle      className="h-4 w-4 shrink-0" />}
          {t.type === "info"    && <Info         className="h-4 w-4 shrink-0" />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
