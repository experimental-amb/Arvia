"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import * as XLSX from "xlsx";
import { FileDown, FileUp, Loader2, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { publishBulkProperties } from "@/services/api";

interface BulkImportModalProps {
  onSuccess?: () => void;
}

const REQUIRED_COLUMNS = ["title", "comuna", "price"] as const;
const NUMERIC_COLUMNS  = ["price", "bedrooms", "bathrooms", "sqm"] as const;

function validateRows(rows: any[]): void {
  if (rows.length === 0) throw new Error("El archivo está vacío.");
  if (rows.length > 1000)
    throw new Error(`Demasiadas filas: ${rows.length}. Máximo permitido: 1.000.`);

  const firstRow = rows[0] as Record<string, unknown>;
  const presentCols = Object.keys(firstRow).map((k) => k.toLowerCase().trim());

  const missing = REQUIRED_COLUMNS.filter((col) => !presentCols.includes(col));
  if (missing.length > 0) {
    throw new Error(
      `Columnas requeridas faltantes: ${missing.join(", ")}.\n` +
        `Descarga la plantilla base para ver el formato correcto.`
    );
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, unknown>;
    for (const col of NUMERIC_COLUMNS) {
      const val = row[col];
      if (val !== undefined && val !== "" && isNaN(Number(val))) {
        throw new Error(
          `Fila ${i + 2}: la columna "${col}" debe ser numérica (valor: "${val}")`
        );
      }
    }
    if (!row["title"] || String(row["title"]).trim().length < 3) {
      throw new Error(`Fila ${i + 2}: "title" debe tener al menos 3 caracteres.`);
    }
    if (!row["comuna"] || String(row["comuna"]).trim() === "") {
      throw new Error(`Fila ${i + 2}: "comuna" no puede estar vacía.`);
    }
    if (Number(row["price"]) <= 0) {
      throw new Error(`Fila ${i + 2}: "price" debe ser mayor que 0.`);
    }
  }
}

export function BulkImportModal({ onSuccess }: BulkImportModalProps) {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage]   = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [open, setOpen]         = useState(false);

  /** Resetea completamente el estado al abrir/cerrar el modal */
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!loading) {
        setOpen(next);
        if (!next) {
          // Al cerrar, limpiar el estado para la próxima apertura
          setTimeout(() => {
            setStatus("idle");
            setMessage("");
            setRowCount(0);
          }, 200);
        }
      }
    },
    [loading]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Resetear el input para que pueda seleccionarse el mismo archivo de nuevo
    e.target.value = "";

    if (!file) return;

    setLoading(true);
    setStatus("idle");
    setMessage("");

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const byteArray   = new Uint8Array(arrayBuffer);
        const wb   = XLSX.read(byteArray, { type: "array" });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        validateRows(data);
        setRowCount(data.length);

        await publishBulkProperties(data, user?.uid);

        setStatus("success");
        setMessage(`¡${data.length} propiedades importadas correctamente!`);
        onSuccess?.();

        // Auto-cerrar modal tras 2.5 s
        setTimeout(() => handleOpenChange(false), 2500);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message ?? "Error al procesar el archivo.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setLoading(false);
      setStatus("error");
      setMessage("No se pudo leer el archivo. Inténtalo de nuevo.");
    };

    reader.readAsArrayBuffer(file);
  };

  /* ─── Derivados visuales ─── */
  const icon =
    loading      ? <Loader2     className="h-10 w-10 animate-spin text-[hsl(var(--brand))]" /> :
    status === "success" ? <CheckCircle2 className="h-10 w-10 text-emerald-400" /> :
    status === "error"   ? <AlertCircle  className="h-10 w-10 text-red-400" /> :
                           <UploadCloud  className="h-10 w-10 text-muted-foreground" />;

  const label =
    loading          ? "Procesando…" :
    status === "success" ? "¡Carga completada!" :
    status === "error"   ? "Error en la carga" :
                           "Arrastra o selecciona tu archivo";

  const sublabel =
    status === "idle" ? "Soporta .xlsx, .xls y .csv" :
    status === "success" ? `${rowCount} propiedades añadidas` : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
          <FileUp className="h-4 w-4" />
          Importación Masiva
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px] bg-[hsl(var(--background))] border-white/10">
        <DialogHeader>
          <DialogTitle>Carga Masiva</DialogTitle>
          <DialogDescription>
            Sube tu archivo Excel o CSV para publicar múltiples propiedades de golpe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Drop zone */}
          <label
            className={[
              "relative flex flex-col items-center justify-center gap-3 p-8",
              "border-2 border-dashed rounded-2xl bg-white/5 text-center transition",
              loading
                ? "cursor-wait opacity-70"
                : status === "success"
                ? "border-emerald-500/50 bg-emerald-500/5"
                : status === "error"
                ? "border-red-500/40 bg-red-500/5 hover:border-red-400/60"
                : "border-white/10 hover:border-[hsl(var(--brand))]/50 hover:bg-white/[0.07] cursor-pointer",
            ].join(" ")}
          >
            {icon}

            <div className="space-y-0.5">
              <p className="text-sm font-medium">{label}</p>
              {sublabel && (
                <p className="text-xs text-muted-foreground">{sublabel}</p>
              )}
            </div>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="absolute inset-0 w-full h-full opacity-0 disabled:cursor-not-allowed"
              style={{ cursor: loading ? "wait" : "pointer" }}
              onChange={handleFileUpload}
              disabled={loading || status === "success"}
            />
          </label>

          {/* Mensaje de error o éxito */}
          {message && (
            <div
              className={`text-xs text-center px-3 py-2 rounded-xl whitespace-pre-wrap ${
                status === "success"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-red-500/10 text-red-300"
              }`}
            >
              {message}
            </div>
          )}

          {/* Plantilla */}
          <div className="flex flex-col gap-1.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Plantilla
            </h4>
            <a
              href="/plantilla_arvia.csv"
              download
              className="flex items-center gap-2 text-sm text-[hsl(var(--brand))] hover:underline w-fit"
            >
              <FileDown className="h-4 w-4" />
              Descargar plantilla base (.csv)
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
