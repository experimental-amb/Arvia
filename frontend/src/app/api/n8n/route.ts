/**
 * Proxy API route — reenvía todas las peticiones del frontend al webhook de n8n.
 *
 * Por qué existe esto:
 *   El frontend (Vercel) no puede llamar directamente al webhook de n8n/ngrok
 *   desde el browser porque el browser bloquea cross-origin requests (CORS).
 *   Este route handler corre en el servidor de Vercel, donde CORS no aplica.
 *
 * Variables de entorno (en orden de prioridad):
 *   N8N_WEBHOOK_URL          — preferida (server-side, no expuesta al browser)
 *   NEXT_PUBLIC_API_BASE_URL — fallback (compatible con configuración anterior)
 *   N8N_API_KEY / NEXT_PUBLIC_API_KEY — API key para el workflow (opcional)
 */

import { NextRequest, NextResponse } from "next/server";

// Soporta tanto la variable nueva (server-only) como la anterior (NEXT_PUBLIC_)
const N8N_URL =
  process.env.N8N_WEBHOOK_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";
const N8N_KEY =
  process.env.N8N_API_KEY ??
  process.env.NEXT_PUBLIC_API_KEY ??
  "";

export async function POST(req: NextRequest) {
  if (!N8N_URL) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL no configurada en el servidor. Agrega la variable de entorno en Vercel." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body inválido" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
  if (N8N_KEY) {
    headers["x-api-key"] = N8N_KEY;
  }

  let res: Response;
  try {
    res = await fetch(N8N_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    // Error de red — ngrok caído o URL incorrecta
    return NextResponse.json(
      {
        error: `No se pudo conectar con n8n: ${err?.message ?? "network error"}. Verifica que ngrok esté corriendo y que N8N_WEBHOOK_URL sea correcta.`,
      },
      { status: 502 }
    );
  }

  const text = await res.text();

  if (!res.ok) {
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch {}
    return NextResponse.json(
      { error: parsed?.error ?? `n8n respondió con error ${res.status}`, raw: text.slice(0, 200) },
      { status: res.status }
    );
  }

  if (!text) {
    return NextResponse.json(
      { error: "n8n no envió respuesta. Verifica que el workflow esté activo y publicado." },
      { status: 502 }
    );
  }

  if (text.trim().startsWith("<")) {
    return NextResponse.json(
      { error: "n8n devolvió HTML. Verifica que ngrok esté corriendo y el workflow importado." },
      { status: 502 }
    );
  }

  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: `Respuesta inválida de n8n: ${text.slice(0, 120)}` },
      { status: 502 }
    );
  }
}
