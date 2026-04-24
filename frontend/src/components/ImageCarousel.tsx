"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  alt?: string;
  className?: string;
}

export function ImageCarousel({ images, alt = "Property image", className }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  if (!images.length) {
    return (
      <div
        className={cn(
          "aspect-[16/10] w-full rounded-2xl bg-white/5 flex items-center justify-center text-sm text-muted-foreground",
          className,
        )}
      >
        Sin imágenes
      </div>
    );
  }

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i) => (i + dir + images.length) % images.length);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-black/20", className)}>
      <div className="relative aspect-[16/10] w-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={images[index]}
            src={images[index]}
            alt={alt}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full glass p-2 hover:bg-white/15 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full glass p-2 hover:bg-white/15 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <a
          href={images[index]}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 top-3 rounded-full glass p-2 hover:bg-white/15 transition"
          aria-label="Ver imagen en tamaño completo"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Thumbs */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              className={cn(
                "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border transition",
                i === index
                  ? "border-[hsl(var(--brand))] ring-2 ring-[hsl(var(--brand))]/50"
                  : "border-white/10 opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
