import type { Property, SearchFilters, SearchResult } from "@/types/property";

/**
 * API client — todas las peticiones van al proxy Next.js /api/n8n.
 * El proxy reenvía al webhook de n8n (server-to-server, sin CORS).
 *
 * IMPORTANTE: n8n v6 envuelve TODAS las respuestas exitosas en:
 *   { success: true, data: <payload>, count: N, timestamp: "..." }
 * Cada método desenvuelve explícitamente con unwrapN8n().
 */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

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

// ─── Core request ────────────────────────────────────────────────────────────

async function n8nRequest<T>(operation: string, payload: any = {}): Promise<T> {
  if (USE_MOCK) {
    console.warn("Mock Data activo — configura N8N_WEBHOOK_URL en Vercel para datos reales");
    return mockFallback<T>(operation, payload);
  }

  const res = await fetch("/api/n8n", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, payload }),
  });

  const text = await res.text();

  if (!res.ok) {
    let body: any = {};
    try { body = JSON.parse(text); } catch {}
    const err: ApiError = new Error((body as any)?.error ?? `API Error ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Respuesta inválida del servidor: ${text.slice(0, 120)}`);
  }
}

/**
 * n8n v6 Format Response envuelve SIEMPRE en { success, data, count, timestamp }.
 * Si la respuesta tiene esa forma, extrae .data; si no, devuelve tal cual.
 */
function unwrapN8n<T>(raw: any): T {
  if (raw && typeof raw === "object" && "success" in raw && "data" in raw) {
    return raw.data as T;
  }
  return raw as T;
}

/**
 * Garantiza que el resultado sea siempre un array (Property[]).
 * n8n devuelve objeto cuando hay exactamente 1 resultado.
 */
function toArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") return [val];
  return [];
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function searchProperties(filters: SearchFilters): Promise<SearchResult> {
  const res = await n8nRequest<any>("ai_search", { prompt: filters.q || "todas" });
  const items = toArray<Property>(unwrapN8n(res));
  return {
    items,
    total: items.length,
    query: filters.q ?? "",
    aiSummary: `Encontré ${items.length} propiedades en la base de datos.`,
  };
}

export async function getProperty(id: string): Promise<Property | null> {
  const res = await n8nRequest<any>("get_property", { id });
  const data = unwrapN8n<any>(res);
  return toArray<Property>(data)[0] ?? null;
}

export async function publishProperty(input: any): Promise<Property> {
  const res = await n8nRequest<any>("publish", input);
  const data = unwrapN8n<any>(res);
  return { ...input, id: String(data?.id ?? data) };
}

export async function publishBulkProperties(
  properties: any[],
  userI