import type { Property, SearchFilters, SearchResult } from "@/types/property";

/**
 * API client for the InitCore backend (n8n Web API branch).
 *
 * Todas las peticiones van a /api/n8n — un proxy Next.js que reenvía al
 * webhook de n8n server-to-server. Esto elimina los errores CORS del browser
 * que ocurren cuando el frontend (Vercel) intenta llamar directamente a ngrok.
 *
 * Variables de entorno necesarias en Vercel (server-side, sin NEXT_PUBLIC_):
 *   N8N_WEBHOOK_URL  — URL completa del webhook de n8n
 *   N8N_API_KEY      — API key para el workflow (opcional)
 */

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

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
    console.warn("Mock Data activo — configura N8N_WEBHOOK_URL en Vercel para datos reales");
    return mockFallback<T>(operation, payload);
  }

  // Llamamos al proxy Next.js en /api/n8n (mismo origen → sin CORS)
  const res = await fetch("/api/n8n", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, payload }),
  });

  const text = await res.text();

  if (!res.ok) {
    let body: any = {};
    try { body = JSON.parse(text); } catch {}
    const err: ApiError = new Error(
      (body as any)?.error ?? `API Error ${res.status}`
    );
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
