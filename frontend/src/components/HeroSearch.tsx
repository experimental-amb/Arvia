"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROMPTS = [
  "Depto con vista al mar en Reñaca, 3 dormitorios",
  "Casa familiar en La Serena con jardín bajo 200M",
  "Loft cerca del metro en Providencia para inversión",
  "Penthouse en Las Condes con vista cordillera",
  "Oficina A+ 180 m² en El Golf",
];

const CHIPS = [
  "Inversión bajo UF 6000",
  "3+ dormitorios en Las Condes",
  "Casa con piscina en Algarrobo",
  "Depto nuevo cerca del metro",
];

export function HeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter placeholder
  useEffect(() => {
    const target = PROMPTS[placeholderIdx];
    let i = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (!deleting) {
        i++;
        setTyped(target.slice(0, i));
        if (i >= target.length) {
          deleting = true;
          timer = setTimeout(tick, 1800);
          return;
        }
      } else {
        i--;
        setTyped(target.slice(0, i));
        if (i <= 0) {
          deleting = false;
          setPlaceholderIdx((v) => (v + 1) % PROMPTS.length);
          return;
        }
      }
      timer = setTimeout(tick, deleting ? 25 : 55);
    };

    timer = setTimeout(tick, 200);
    return () => clearTimeout(timer);
  }, [placeholderIdx]);

  const submit = (q: string) => {
    const qq = q.trim();
    if (!qq) return;
    router.push(`/search?q=${encodeURIComponent(qq)}`);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Glow */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute -inset-6 -z-10 rounded-[36px] bg-[radial-gradient(ellipse_at_center,hsl(var(--brand)/0.35),transparent_60%)] blur-2xl"
      />

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="glass-strong rounded-3xl p-3 shadow-soft"
      >
        <div className="flex items-center gap-2 rounded-2xl bg-black/20 px-4 py-3 ring-1 ring-white/10 focus-within:ring-[hsl(var(--brand))]/60 transition">
          <Sparkles className="h-4 w-4 text-[hsl(var(--brand))]" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={typed || "Describe tu propiedad ideal…"}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
          />
          <Button type="submit" size="sm" className="gap-1.5">
            <Wand2 className="h-3.5 w-3.5" />
            Buscar
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.form>

      {/* Example chips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-4 flex flex-wrap items-center justify-center gap-2"
      >
        <span className="text-xs uppercase tracking-wider text-muted-foreground/70">
          Prueba:
        </span>
        <AnimatePresence>
          {CHIPS.map((chip, i) => (
            <motion.button
              key={chip}
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => {
                setValue(chip);
                submit(chip);
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-[hsl(var(--brand))]/50 transition"
            >
              {chip}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
