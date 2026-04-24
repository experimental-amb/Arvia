import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format CLP price. Falls back to raw number for unknown currencies. */
export function formatPrice(value: number, currency: "CLP" | "USD" | "UF" = "CLP") {
  if (currency === "UF") {
    return `UF ${value.toLocaleString("es-CL", { maximumFractionDigits: 0 })}`;
  }
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSqm(sqm: number | null | undefined) {
  if (sqm == null) return "—";
  return `${sqm.toLocaleString("es-CL")} m²`;
}
