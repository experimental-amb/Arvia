"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProperty } from "@/services/api";
import { useAuth } from "@/lib/auth-context";
import type { Property } from "@/types/property";
import { getComunasByRegion, REGIONES_CHILE } from "@/lib/chile-regiones";

interface EditPropertyModalProps {
  property: Property;
  onClose: () => void;
  onSaved: (updated: Property) => void;
}

export function EditPropertyModal({ property, onClose, onSaved }: EditPropertyModalProps) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    title:       property.title       ?? "",
    description: property.description ?? "",
    price:       String(property.price ?? ""),
    region:      property.region      ?? "",
    comuna:      property.comuna      ?? "",
    address:     property.address     ?? "",
    bedrooms:    String(property.bedrooms  ?? 0),
    bathrooms:   String(property.bathrooms ?? 0),
    sqm:         String(property.sqm       ?? 0),
  });

  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState<string | null>(null);

  const comunasDisponibles = getComunasByRegion(form.region);

  const setField = <K extends keyof typeof form>(key: K, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegionChange = (region: string) =>
    setForm((prev) => ({ ...prev, region, comuna: "" }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateProperty(
        property.id,
        {
          title:       form.title,
          description: form.description,
          price:       Number(form.price),
          region:      form.region,
          comuna:      form.comuna,
          address:     form.address || undefined,
          bedrooms:    Number(form.bedrooms),
          bathrooms:   Number(form.bathrooms),
          sqm:         Number(form.sqm),
        },
        user?.uid
      );
      onSaved({
        ...property,
        title:       form.title,
        description: form.description,
        price:       Number(form.price),
        region:      form.region,
        comuna:      form.comuna,
        address:     form.address,
        bedrooms:    Number(form.bedrooms),
        bathrooms:   Number(form.bathrooms),
        sqm:         Number(form.sqm),
      });
    } catch (err: any) {
      setError(err?.message ?? "No se pudo guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] bg-[hsl(var(--background))] border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar propiedad</DialogTitle>
          <DialogDescription>
            Modifica los datos y guarda los cambios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 py-2">
          {/* Titulo */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Titulo</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </div>

          {/* Descripcion */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Descripcion</Label>
            <Textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={4}
            />
          </div>

          {/* Precio */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-price">Precio (CLP)</Label>
            <Input
              id="edit-price"
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              required
            />
          </div>

          {/* Region + Comuna */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Select value={form.region} onValueChange={handleRegionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una region" />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto">
                  {REGIONES_CHILE.map((r) => (
                    <SelectItem key={r.codigo} value={r.nombre}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Comuna</Label>
              <Select
                value={form.comuna}
                onValueChange={(v) => setField("comuna", v)}
                disabled={comunasDisponibles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={comunasDisponibles.length === 0 ? "Elige region primero" : "Selecciona"} />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto">
                  {comunasDisponibles.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Direccion */}
          <div className="space-y-1.5">
            <Label>Direccion (opcional)</Label>
            <Input
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Calle + numero"
            />
          </div>

          {/* Dorm Banos M2 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Dorm.</Label>
              <Input type="number" min={0} value={form.bedrooms} onChange={(e) => setField("bedrooms", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Banos</Label>
              <Input type="number" min={0} value={form.bathrooms} onChange={(e) => setField("bathrooms", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>M2</Label>
              <Input type="number" min={0} value={form.sqm} onChange={(e) => setField("sqm", e.target.value)} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
