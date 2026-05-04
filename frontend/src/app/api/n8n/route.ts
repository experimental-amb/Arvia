/**
 * /api/n8n — Proxy server-side hacia n8n webhook.
 *
 * Por que existe: CORS bloquea requests directos desde Vercel a ngrok.
 * Este handler corre en el servidor (Node.js Edge), donde CORS no aplica.
 *
 * Variables requeridas:
 *   N8N_WEBHOOK_URL      — URL del webhook (server-only, prioritaria)
 *   NEXT_PUBLIC_API_BASE_URL — Fallback si la anterior no esta definida
 *   N8N_API_KEY          — API key para x-api-key header (server-only)
 *   NEXT_PUBLIC_API_KEY  — Fallback publico de la anterior
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

const FETCH_TIMEOUT_MS = 30_000;

function requestId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function log(level: "INFO" | "WARN" | "ERROR", rid: string, msg: string, extra?: object) {
  const entry = { ts: new Date().toISOString(), level, rid, msg, ...extra };
  if (level === "ERROR") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export async function POST(req: NextRequest) {
  const rid = requestId();
  const startMs = Date.now();

  /* 1. URL configurada */
  if (!N8N_URL) {
    log("ERROR", rid, "N8N_WEBHOOK_URL no configurada");
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL no configurada. Agrega la variable en Vercel." },
      { status: 503 }
    );
  }

  /* 2. Parsear body */
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    log("WARN", rid, "Request body invalido");
    return NextResponse.json({ error: "Request body invalido (no es JSON)." }, { status: 400 });
  }

  const operation = (body as any)?.operation ?? "unknown";
  log("INFO", rid, "Proxying request", { operation });

  /* 3. Headers hacia n8n */
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    "X-Request-ID": rid,
  };
  if (N8N_KEY) headers["x-api-key"] = N8N_KEY;

  /* 4. Llamar a n8n con timeout */
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
    const durationMs = Date.now() - startMs;
    log("ERROR", rid, isTimeout ? "n8n timeout" : "n8n unreachable", {
      operation,
      durationMs,
      error: err?.message,
    });
    return NextResponse.json(
      {
        error: isTimeout
          ? `n8n no respondio en ${FETCH_TIMEOUT_MS / 1000}s. El workflow puede estar procesando en segundo plano.`
          : `No se pudo conectar con n8n: ${err?.message ?? "network error"}. Verifica que ngrok/VPS este activo.`,
      },
      { status: 502 }
    );
  }

  /* 5. Leer respuesta */
  const text = await res.text();
  const durationMs = Date.now() - startMs;

  // n8n devuelve HTML si ngrok intercepta
  if (text.trim().startsWith("<")) {
    log("ERROR", rid, "ngrok intercepto la peticion (respuesta HTML)", { operation, durationMs });
    return NextResponse.json(
      { error: "ngrok intercepto la peticion. Verifica que el tunel este activo y la URL sea correcta." },
      { status: 502 }
    );
  }

  // Body vacio
  if (!text.trim()) {
    log("WARN", rid, "n8n respondio con body vacio", { operation, status: res.status, durationMs });
    return NextResponse.json(
      {
        error:
          `n8n no envio respuesta (body vacio, HTTP ${res.status}). ` +
          `Verifica: 1) Workflow activo. 2) Nodo Respond to Webhook conectado. 3) Path "web-api" correcto.`,
      },
      { status: 502 }
    );
  }

  // Error HTTP de n8n
  if (!res.ok) {
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch {}
    log("WARN", rid, "n8n respondio con error HTTP", { operation, status: res.status, durationMs });
    return NextResponse.json(
      { error: parsed?.error ?? `n8n respondio con error HTTP ${res.status}`, detail: text.slice(0, 300) },
      { status: res.status }
    );
  }

  /* 6. Devolver respuesta exitosa */
  try {
    const data = JSON.parse(text);
    log("INFO", rid, "Request completado", { operation, durationMs, status: res.status });
    return NextResponse.json(data, {
      status: 200,
      headers: { "X-Request-ID": rid, "X-Duration-Ms": String(durationMs) },
    });
  } catch {
    log("ERROR", rid, "Respuesta de n8n no es JSON valido", { operation, durationMs });
    return NextResponse.json(
      { error: `Respuesta de n8n no es JSON valido: ${text.slice(0, 200)}` },
      { status: 502 }
    );
  }
}
