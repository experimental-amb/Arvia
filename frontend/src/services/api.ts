import type { Property, SearchFilters, SearchResult } from "@/types/property";

/**
 * API client - todas las peticiones van al proxy Next.js /api/n8n.
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

// Core request

async function n8nRequest<T>(operation: string, payload: any = {}): Promise<T> {
  if (USE_MOCK) {
    console.warn("Mock Data activo");
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
    try { body = JSON.parse(text); } catch (_e) { /* ignore */ }
    const err: ApiError = new Error((body as any)?.error ?? `API Error ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  try {
    return JSON.parse(text) as T;
  } catch (_e) {
    throw new Error(`Respuesta invalida del servidor: ${text.slice(0, 120)}`);
  }
}

function unwrapN8n<T>(raw: any): T {
  if (raw && typeof raw === "object" && "success" in raw && "data" in raw) {
    return raw.data as T;
  }
  return raw as T;
}

function toArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") return [val];
  return [];
}

// API Methods

export async function searchProperties(filters: SearchFilters): Promise<SearchResult> {
  const res = await n8nRequest<any>("ai_search", { prompt: filters.q || "todas" });
  const items = toArray<Property>(unwrapN8n(res));
  return {
    items,
    total: items.length,
    query: filters.q ?? "",
    aiSummary: `Encontre ${items.length} propiedades.`,
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
  userId?: string
): Promise<{ count: number }> {
  const res = await n8nRequest<any>("publish_bulk", { properties, userId });
  const data = unwrapN8n<any>(res);
  return { count: Number(data?.inserted ?? data?.count ?? properties.length) };
}

export async function getDashboardProperties(userId?: string): Promise<Property[]> {
  const res = await n8nRequest<any>("ai_search", { prompt: "mis propiedades", userId });
  return toArray<Property>(unwrapN8n(res));
}

export async function getStats(): Promise<DashboardStats> {
  const res = await n8nRequest<any>("get_stats", {});
  const raw = unwrapN8n<any>(res);
  return {
    totalProperties:     Number(raw?.totalProperties     ?? 0),
    publishedProperties: Number(raw?.publishedProperties ?? 0),
    totalLeads:          Number(raw?.totalLeads          ?? 0),
    pendingMessages:     Number(raw?.pendingMessages     ?? 0),
  };
}

export async function togglePropertyStatus(
  id: string,
  status: "published" | "draft",
  userId?: string
): Promise<void> {
  await n8nRequest("toggle_status", { id, status, userId });
}

export async function aiChat(_message: string) {
  return { reply: "Conectado al asistente web." };
}

// Mock Fallbacks
async function mockFallback<T>(op: string, _payload: any): Promise<T> {
  if (op === "get_stats") {
    return {
      totalProperties: 0,
      publishedProperties: 0,
      totalLeads: 0,
      pendingMessages: 0,
    } as unknown as T;
  }
  return [] as unknown as T;
}
