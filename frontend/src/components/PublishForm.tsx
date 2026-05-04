"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { publishProperty } from "@/services/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { REGIONES_CHILE, getComunasByRegion, REGION_NAMES } from "@/lib/chile-regiones";
import { ImageUpload } from "@/components/ImageUpload";

export function PublishForm() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const REGION_DEFAULT = REGIONES_CHILE.find((r) => r.codigo === "RM")!.nombre;

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    region: REGION_DEFAULT,
    comuna: "",
    address: "",
    bedrooms: "2",
    bathrooms: "1",
    sqm: "",
  });

  // Comunas disponibles según la región seleccionada
  const comunasDisponibles = getComunasByRegion(form.region);

  const handleRegionChange = (nuevaRegion: string) => {
    setForm((prev) => ({ ...prev, region: nuevaRegion, comuna: "" }));
  };
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string].slice(0, 6));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Debes iniciar sesion para publicar propiedades.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await publishProperty({
        title: form.title,
        description: form.description,
        price: Number(form.price),
        region: form.region,
        comuna: form.comuna,
        address: form.address || undefined,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        sqm: Number(form.sqm),
        images,
        userId: user?.uid,
      });
      setDone(true);
      toast.success("Propiedad publicada correctamente.");
      setTimeout(() => router.push(`/property/${created.id}`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-10 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-xl font-semibold">¡Publicación creada!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Redirigiéndote a la ficha de tu propiedad…
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-[2fr,1fr]"
    >
      {/* Main column */}
      <div className="space-y-6">
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <Header icon={<Sparkles className="h-3.5 w-3.5" />} eyebrow="Paso 1">
            Datos básicos
          </Header>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ej: Depto con vista al mar en Reñaca"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe las características principales, amenities, terminaciones…"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              required
              rows={5}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Dormitorios</Label>
              <Input
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => setField("bedrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Baños</Label>
              <Input
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={(e) => setField("bathrooms", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Superficie (m²)</Label>
              <Input
                type="number"
                min={0}
                value={form.sqm}
                onChange={(e) => setField("sqm", e.target.value)}
                required
              />
            </div>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6 space-y-4">
          <Header icon={<Sparkles className="h-3.5 w-3.5" />} eyebrow="Paso 2">
            Ubicación y precio
          </Header>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Selector Región */}
            <div className="space-y-2">
              <Label htmlFor="region">Región</Label>
              <Select value={form.region} onValueChange={handleRegionChange}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Selecciona una región" />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto">
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

            {/* Selector Comuna — filtrado por región seleccionada */}
            <div className="space-y-2">
              <Label htmlFor="comuna">Comuna</Label>
              <Select
                value={form.comuna}
                onValueChange={(v) => setField("comuna", v)}
                disabled={comunasDisponibles.length === 0}
              >
                <SelectTrigger id="comuna">
                  <SelectValue
                    placeholder={
                      comunasDisponibles.length === 0
                        ? "Primero elige una región"
                        : "Selecciona una comuna"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto">
                  {comunasDisponibles.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección (opcional)</Label>
            <Input
              placeholder="Calle + número"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Precio (CLP)</Label>
            <Input
              type="number"
              min={0}
              placeholder="150000000"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              required
            />
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6 space-y-4">
          <Header icon={<ImagePlus className="h-3.5 w-3.5" />} eyebrow="Paso 3">
            Imágenes de la propiedad
          </Header>
          <ImageUpload 
            maxFiles={6} 
            onUpload={(urls) => setImages(prev => [...prev, ...urls].slice(0, 6))} 
          />
          {images.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center">
              * Las imágenes se optimizan automáticamente para carga rápida.
            </p>
          )}
        </section>
      </div>

      {/* Right column: preview + submit */}
      <div className="space-y-4 lg:sticky lg:top-24 h-fit">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
            <Sparkles className="h-3.5 w-3.5" /> Vista previa
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            <div className="aspect-[4/3] bg-white/5">
              {images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sin imágenes
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold line-clamp-1">
                {form.title || "Título de tu propiedad"}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {form.description || "Descripción breve…"}
              </div>
              <div className="mt-2 text-sm font-semibold text-[hsl(var(--brand))]">
                {form.price
                  ? new Intl.NumberFormat("es-CL", {
                      style: "currency",
                      currency: "CLP",
                      maximumFractionDigits: 0,
                    }).format(Number(form.price))
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className={cn("w-full", submitting && "opacity-70")}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Publicando…
            </>
          ) : (
            "Publicar propiedad"
          )}
        </Button>
      </div>
    </motion.form>
  );
}

function Header({
  eyebrow,
  icon,
  children,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[hsl(var(--brand))]">
        {icon}
        {eyebrow}
      </div>
      <h2 className="text-lg font-semibold mt-1">{children}</h2>
    </div>
  );
}
