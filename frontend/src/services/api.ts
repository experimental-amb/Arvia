import type { Property, SearchFilters, SearchResult } from "@/types/property";

/**
 * API client for the InitCore backend (n8n Web API branch).
 * All requests are routed through a unified webhook endpoint.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const API_KEY  = process.env.NEXT_PUBLIC_API_KEY ?? "";
const USE_MOCK = !API_BASE || process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface ApiError extends Error {
  status?: number;
  body?: unknown;
}

// T19: Tipado de las estadísticas del dashboard
export interface DashboardStats {
  totalProperties: number;
  publishedProperties: number;
  totalLeads: number;
  pendingMessages: number;
}

async function n8nRequest<T>(operation: string, payload: any = {}): Promise<T> {
  if (USE_MOCK) {
    console.warn("Using Mock Data - Configura NEXT_PUBLIC_API_BASE_URL para usar la API real");
    return mockFallback<T>(operation, payload);
  }

  // T16: Eliminado header ngrok "ngrok-skip-browser-warning"
  // T16: Añadida autenticación real vía x-api-key
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }

  const res = await fetch(API_BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ operation, payload }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: ApiError = new Error(
      (body as any)?.error ?? `API Error: ${res.status}`
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return res.json() as Promise<T>;
}

/* --------------------------- API Methods -------------------------- */

export async function searchProperties(filters: SearchFilters): Promise<SearchResult> {
  const items = await n8nRequest<Property[]>("ai_search", { prompt: filters.q || "todas" });
  return {
    items,
    total: items.length,
    query: filters.q ?? "",
    aiSummary: `Encontré ${items.length} propiedades reales en la base de datos.`
  };
}

// T17: Corregido — usa operación dedicada get_property en lugar de ai_search con prompt hack
export async function getProperty(id: string): Promise<Property | null> {
  const result = await n8nRequest<Property | null>("get_property", { id });
  return result ?? null;
}

export async function publishProperty(input: any): Promise<Property> {
  const result = await n8nRequest<{ id: number }>("publish", input);
  return { ...input, id: String(result.id) };
}

export async function publishBulkProperties(properties: any[]): Promise<{ count: number }> {
  return n8nRequest<{ count: number }>("publish_bulk", { properties });
}

export async function getDashboardProperties(userId?: string): Promise<Property[]> {
  return n8nRequest<Property[]>("ai_search", { prompt: "mis propiedades" });
}

// T19: Nueva función — obtiene métricas reales del backend
export async function getStats(): Promise<DashboardStats> {
  return n8nRequest<DashboardStats>("get_stats", {});
}

export async function aiChat(message: string) {
  return { reply: "Conectado al asistente web. ¿En qué puedo ayudarte?" };
}

/* --------------------------- Mock Fallbacks ----------------------- */
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
