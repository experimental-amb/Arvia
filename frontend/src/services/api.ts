"use client";

import type { Property, SearchFilters, SearchResult } from "@/types/property";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

export interface ApiError extends Error {
  status?: number;
  body?: unknown;
}

export interface DashboardStats {
  totalProperties: number;
  publishedProperties: number;
  totalLeads: number;
  pendingMessages: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function n8nRequest<T>(operation: string, payload: any = {}, attempt = 0): Promise<T> {
  if (USE_MOCK) return mockFallback<T>(operation, payload);

  try {
    const res = await fetch("/api/n8n", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, payload }),
    });

    const text = await res.text();

    if (!res.ok) {
      let body: any = {};
      try { body = JSON.parse(text); } catch {}
      // Reintentar en errores de red/timeout (502, 503, 504) — NO en errores de cliente (4xx)
      const isRetryable = res.status >= 500 && attempt < MAX_RETRIES;
      if (isRetryable) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
        return n8nRequest<T>(operation, payload, attempt + 1);
      }
      const err: ApiError = new Error((body as any)?.error ?? `API Error ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Respuesta invalida del servidor: ${text.slice(0, 120)}`);
    }
  } catch (err: any) {
    // Reintentar errores de red (fetch fallo completamente)
    if (err?.status === undefined && attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS * Math.pow(2, attempt));
      return n8nRequest<T>(operation, payload, attempt + 1);
    }
    throw err;
  }
}

function unwrapN8n<T>(raw: any): T {
  if (raw && typeof raw === "object" && "success" in raw) {
    if (!raw.success) {
      const err: ApiError = new Error(
        raw.error === "AUTH_FAILED"
          ? "API key incorrecta o no configurada en n8n. Revisa WEB_API_KEY."
          : (raw.error ?? "La operacion fallo en el servidor.")
      );
      err.status = raw.code ?? 400;
      err.body = raw;
      throw err;
    }
    return raw.data as T;
  }
  return raw as T;
}

function toArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") return [val];
  return [];
}

export async function searchProperties(filters: SearchFilters): Promise<SearchResult> {
  const res = await n8nRequest<any>("ai_search", { prompt: filters.q || "todas" });
  const items = toArray<Property>(unwrapN8n(res));
  return {
    items,
    total: items.length,
    query: filters.q ?? "",
    aiSummary: `${items.length} propiedades encontradas.`,
  };
}

export async function getProperty(id: string): Promise<Property | null> {
  const res = await n8nRequest<any>("get_property", { id });
  return toArray<Property>(unwrapN8n(res))[0] ?? null;
}

export async function publishProperty(input: any): Promise<Property> {
  const res = await n8nRequest<any>("publish", input);
  const data = unwrapN8n<any>(res);
  if (!data?.id) {
    throw new Error("No se recibio ID de la propiedad creada. Verifica que el workflow este activo en n8n.");
  }
  return { ...input, id: String(data.id) };
}

export async function publishBulkProperties(
  properties: any[],
  userId?: string
): Promise<{ count: number }> {
  const res = await n8nRequest<any>("publish_bulk", { properties, userId });
  const data = unwrapN8n<any>(res);
  return { count: Number(data?.inserted ?? data?.count ?? properties.length) };
}

export async function getDashboardProperties(userId?: string): Promise<Property[]> {
  const res = await n8nRequest<any>("list_properties", { userId: userId ?? null });
  return toArray<Property>(unwrapN8n(res));
}

export async function getStats(): Promise<DashboardStats> {
  const res = await n8nRequest<any>("get_stats", {});
  const raw = unwrapN8n<any>(res);
  const d = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});
  return {
    totalProperties:     Number(d?.totalProperties     ?? d?.total_properties     ?? 0),
    publishedProperties: Number(d?.publishedProperties ?? d?.published_properties ?? 0),
    totalLeads:          Number(d?.totalLeads          ?? d?.total_leads          ?? 0),
    pendingMessages:     Number(d?.pendingMessages     ?? d?.pending_messages     ?? 0),
  };
}

export async function togglePropertyStatus(
  id: string,
  status: "published" | "draft",
  userId?: string
): Promise<void> {
  await n8nRequest("toggle_status", { id, status, userId });
}

export async function deleteProperty(id: string, userId?: string): Promise<void> {
  await n8nRequest("delete_property", { id, userId: userId ?? null });
}

export async function updateProperty(
  id: string,
  data: {
    title?: string;
    description?: string;
    price?: number;
    region?: string;
    comuna?: string;
    address?: string;
    bedrooms?: number;
    bathrooms?: number;
    sqm?: number;
  },
  userId?: string
): Promise<void> {
  await n8nRequest("update_property", { id, ...data, userId: userId ?? null });
}

export async function aiChat(message: string): Promise<{ reply: string }> {
  try {
    const res = await n8nRequest<any>("ai_search", { prompt: message });
    const items = toArray<Property>(unwrapN8n(res));
    if (items.length > 0) {
      const preview = items
        .slice(0, 3)
        .map((p) => `- ${p.title} en ${p.comuna} (${p.price?.toLocaleString("es-CL")} CLP)`)
        .join("\n");
      return { reply: `Encontre ${items.length} propiedades:\n${preview}` };
    }
    return { reply: "No encontre propiedades que coincidan con tu busqueda." };
  } catch {
    return { reply: "No pude procesar tu consulta en este momento. Intenta de nuevo." };
  }
}

async function mockFallback<T>(op: string, _payload: any): Promise<T> {
  if (op === "get_stats")
    return { totalProperties: 0, publishedProperties: 0, totalLeads: 0, pendingMessages: 0 } as unknown as T;
  return [] as unknown as T;
}
