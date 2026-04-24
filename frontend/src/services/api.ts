import type { Property, SearchFilters, SearchResult } from "@/types/property";

/**
 * API client for the InitCore backend (n8n Web API branch).
 * All requests are routed through a unified webhook endpoint.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const USE_MOCK = !API_BASE || process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export interface ApiError extends Error {
  status?: number;
  body?: unknown;
}

async function n8nRequest<T>(operation: string, payload: any = {}): Promise<T> {
  if (USE_MOCK) {
    console.warn("Using Mock Data - Config NEXT_PUBLIC_API_BASE_URL to use real API");
    return mockFallback<T>(operation, payload);
  }

  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, payload }),
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
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

export async function getProperty(id: string): Promise<Property | null> {
  const items = await n8nRequest<Property[]>("ai_search", { prompt: `id:${id}` });
  return items[0] || null;
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

export async function aiChat(message: string) {
  return { reply: "Conectado al asistente web. ¿En qué puedo ayudarte?" };
}

/* --------------------------- Mock Fallbacks ----------------------- */
async function mockFallback<T>(op: string, payload: any): Promise<T> {
  // Logic to maintain basic functionality if n8n is offline
  return [] as any;
}
