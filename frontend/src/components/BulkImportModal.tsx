"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { FileDown, FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

export function BulkImportModal({ onSuccess }: BulkImportModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  // T18: Validación de esquema — columnas requeridas y tipos de datos
  const REQUIRED_COLUMNS = ["title", "comuna", "price"] as const;
  const NUMERIC_COLUMNS  = ["price", "bedrooms", "bathrooms", "sqm"] as const;

  function validateRows(rows: any[]): void {
    if (rows.length === 0) throw new Error("El archivo está vacío");
    if (rows.length > 1000) throw new Error(`Demasiadas filas: ${rows.length}. Máximo permitido: 1 000`);

    const firstRow = rows[0] as Record<string, unknown>;
    const presentCols = Object.keys(firstRow).map((k) => k.toLowerCase().trim());

    const missing = REQUIRED_COLUMNS.filter(
      (col) => !presentCols.includes(col)
    );
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
            `Fila ${i + 2}: la columna "${col}" debe ser numérica (valor recibido: "${val}")`
          );
        }
      }
      if (!row["title"] || String(row["title"]).trim().length < 3) {
        throw new Error(`Fila ${i + 2}: "title" debe tener al menos 3 caracteres`);
      }
      if (!row["comuna"] || String(row["comuna"]).trim() === "") {
        throw new Error(`Fila ${i + 2}: "comuna" no puede estar vacía`);
      }
      if (Number(row["price"]) <= 0) {
        throw new Error(`Fila ${i + 2}: "price" debe ser mayor que 0`);
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus("idle");

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          // Usar ArrayBuffer en vez de BinaryString para soportar UTF-8
          // (tildes, ñ, etc. en CSV chileno)
          const arrayBuffer = evt.target?.result as ArrayBuffer;
          const byteArray = new Uint8Array(arrayBuffer);
          const wb = XLSX.read(byteArray, { type: "array" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);

          // T18: Validar esquema antes de enviar al backend
          validateRows(data);

          // Enviar al backend
          await publishBulkProperties(data);
          
          setStatus("success");
          setMessage(`¡Éxito! Se han importado ${data.length} propiedades.`);
          if (onSuccess) onSuccess();
          
          // Cerrar después de 2 segundos
          setTimeout(() => {
            setOpen(false);
            // Resetear para la próxima vez
            setTimeout(() => {
              setStatus("idle");
              setMessage("");
            }, 500);
          }, 2000);
        } catch (err: any) {
          setStatus("error");
          setMessage(err.message || "Error al procesar el archivo");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setLoading(false);
      setStatus("error");
      setMessage("Error al leer el archivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
          <FileUp className="h-4 w-4" />
          Importación Masiva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[hsl(var(--background))] border-white/10">
        <DialogHeader>
          <DialogTitle>Carga Masiva</DialogTitle>
          <DialogDescription>
            Sube tu archivo Excel o CSV para publicar múltiples propiedades de golpe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 space-y-4 text-center">
            {loading ? (
              <Loader2 className="h-10 w-10 animate-spin text-[hsl(var(--brand))]" />
            ) : status === "success" ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            ) : status === "error" ? (
              <AlertCircle className="h-10 w-10 text-red-400" />
            ) : (
              <FileUp className="h-10 w-10 text-muted-foreground" />
            )}
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {loading ? "Procesando archivo..." : status === "success" ? "Carga completada" : "Selecciona tu archivo"}
              </p>
              <p className="text-xs text-muted-foreground">
                Soporta .xlsx, .xls y .csv
              </p>
            </div>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`text-xs text-center p-2 rounded-lg ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {message}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plantilla</h4>
            <a 
              href="/plantilla_arvia.csv" 
              download 
              className="flex items-center gap-2 text-sm text-[hsl(var(--brand))] hover:underline"
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
