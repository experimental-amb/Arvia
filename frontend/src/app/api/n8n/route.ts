/**
 * Proxy API route — reenvía todas las peticiones del frontend al webhook de n8n.
 *
 * Por qué existe:
 *   El browser bloquea cross-origin requests (CORS) desde Vercel hacia ngrok.
 *   Este route handler corre en el servidor, donde CORS no aplica.
 *
 * Variables de entorno requeridas en Vercel:
 *   NEXT_PUBLIC_API_BASE_URL  — URL completa del webhook n8n (ngrok URL)
 *   N8N_WEBHOOK_URL           — alternativa server-only (prioridad sobre la anterior)
 */

import { NextRequest, NextResponse } from "next/server";

const N8N_URL =
  process.env.N8N_WEBHOOK_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "";

const N8N_KEY =
  process.env.N8N_API_KEY ??
  process.env.NEXT_PUBLIC_API_KEY ??
  "";

// Timeout de 30s para operaciones bulk (CSV grande)
const FETCH_TIMEOUT_MS = 30_000;

export async function POST(req: NextRequest) {
  /* ── 1. URL configurada ─────────────────────────────────────── */
  if (!N8N_URL) {
    return NextResponse.json(
      {
        error:
          "N8N_WEBHOOK_URL no configurada. Agrega NEXT_PUBLIC_API_BASE_URL en las variables de entorno de Vercel.",
      },
      { status: 503 }
    );
  }

  /* ── 2. Parsear body ────────────────────────────────────────── */
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body inválido (no es JSON)." }, { status: 400 });
  }

  /* ── 3. Headers hacia n8n ───────────────────────────────────── */
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };
  if (N8N_KEY) headers["x-api-key"] = N8N_KEY;

  /* ── 4. Llamar a n8n con timeout ───────────────────────────── */
  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    res = await fetch(N8N_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    return NextResponse.json(
      {
        error: isTimeout
          ? `n8n tardó más de ${FETCH_TIMEOUT_MS / 1000}s en responder. El workflow puede estar procesando en segundo plano.`
          : `No se pudo conectar con n8n: ${err?.message ?? "network error"}. Verifica que ngrok esté corriendo.`,
      },
      { status: 502 }
    );
  }

  /* ── 5. Leer respuesta ──────────────────────────────────────── */
  const text = await res.text();

  // n8n devuelve HTML si ngrok intercepta (browser warning)
  if (text.trim().startsWith("<")) {
    return NextResponse.json(
      { error: "ngrok interceptó la petición. Asegúrate de que la URL de ngrok es correcta y que el túnel está activo." },
      { status: 502 }
    );
  }

  // Body vacío — el workflow activo siempre devuelve algo si usa respondToWebhook
  if (!text.trim()) {
    return NextResponse.json(
      {
        error:
          `n8n no envió respuesta (body vacío, HTTP ${res.status}). ` +
          `Verifica: 1) El workflow está activo (toggle verde). 2) El nodo "Web API Response" está conectado. 3) El workflow tiene el path correcto "web-api".`,
      },
      { status: 502 }
    );
  }

  // Error HTTP de n8n
  if (!res.ok) {
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {}
    return NextResponse.json(
      { error: parsed?.error ?? `n8n respondió con error HTTP ${res.status}`, detail: text.slice(0, 300) },
      { status: res.status }
    );
  }

  /* ── 6. Devolver respuesta exitosa ──────────────────────────── */
  try {
    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: `Respuesta de n8n no es JSON válido: ${text.slice(0, 200)}` },
      { status: 502 }
    );
  }
}
