"""
scraper_ml.py — Extractor de propiedades desde MercadoLibre (MLC)
T20: Paginación completa, rate limiting y retry con backoff exponencial.
"""

import urllib.request
import urllib.error
import json
import csv
import time
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Configuración ────────────────────────────────────────────────────────────
PAGE_SIZE      = 50       # Máximo permitido por la API de ML
MAX_PAGES      = 20       # Límite de seguridad: 20 × 50 = 1 000 items
DELAY_BETWEEN  = 1.5      # Segundos entre requests (rate limiting)
MAX_RETRIES    = 3        # Intentos por request
BACKOFF_BASE   = 2        # Backoff exponencial: 2^intento segundos
CATEGORY       = "MLC1459"  # Inmuebles Chile
CSV_OUTPUT     = "propiedades_reales_chile.csv"


def fetch_page(offset: int) -> dict:
    """Descarga una página de resultados con retry + backoff exponencial."""
    url = (
        f"https://api.mercadolibre.com/sites/MLC/search"
        f"?category={CATEGORY}&limit={PAGE_SIZE}&offset={offset}"
    )
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = BACKOFF_BASE ** attempt
                logger.warning("Rate limit (429). Esperando %ds (intento %d/%d)", wait, attempt, MAX_RETRIES)
                time.sleep(wait)
            elif e.code >= 500:
                wait = BACKOFF_BASE ** attempt
                logger.warning("Error servidor %d. Esperando %ds (intento %d/%d)", e.code, wait, attempt, MAX_RETRIES)
                time.sleep(wait)
            else:
                logger.error("HTTP %d para offset=%d. Saltando.", e.code, offset)
                return {}
        except Exception as e:
            wait = BACKOFF_BASE ** attempt
            logger.warning("Error de red: %s. Esperando %ds (intento %d/%d)", e, wait, attempt, MAX_RETRIES)
            time.sleep(wait)
    logger.error("Máximo de reintentos alcanzado para offset=%d. Saltando.", offset)
    return {}


def parse_item(item: dict) -> dict:
    """Extrae y normaliza los campos relevantes de un resultado de la API."""
    location  = item.get("location", {})
    region    = location.get("state", {}).get("name", "Desconocido")
    comuna    = location.get("city", {}).get("name", "Desconocido")
    address   = location.get("address_line", "") or comuna

    bedrooms = bathrooms = sqm = 0
    for attr in item.get("attributes", []):
        aid = attr.get("id", "")
        try:
            val = attr.get("value_struct", {}).get("number") or attr.get("value_name", 0)
            if aid in ("ROOMS", "BEDROOMS"):
                bedrooms = int(val or 0)
            elif aid in ("FULL_BATHROOMS", "BATHROOMS"):
                bathrooms = int(val or 0)
            elif aid in ("COVERED_AREA", "TOTAL_AREA"):
                sqm = float(val or 0)
        except (TypeError, ValueError):
            pass

    title = item.get("title", "")
    price = item.get("price", 0)

    return {
        "title":       title,
        "description": f"Excelente oportunidad en {comuna}. {title}. Precio publicado: ${price}.",
        "price":       price,
        "region":      region,
        "comuna":      comuna,
        "address":     address,
        "bedrooms":    bedrooms,
        "bathrooms":   bathrooms,
        "sqm":         sqm,
        "source":      "scraper",
        "source_url":  item.get("permalink", ""),
        "external_id": str(item.get("id", "")),
    }


def fetch_all_properties() -> list[dict]:
    """Descarga TODAS las páginas disponibles hasta MAX_PAGES."""
    all_items: list[dict] = []

    # Primera página — obtener total real
    logger.info("Descargando primera página (offset=0)…")
    first = fetch_page(0)
    if not first:
        logger.error("No se pudo obtener la primera página. Abortando.")
        return []

    total_available = first.get("paging", {}).get("total", 0)
    results = first.get("results", [])
    all_items.extend(parse_item(r) for r in results)
    logger.info("Total disponible en API: %d. Procesados en página 1: %d", total_available, len(results))

    # Páginas adicionales
    max_offset = min(total_available, MAX_PAGES * PAGE_SIZE)
    offset = PAGE_SIZE

    while offset < max_offset:
        logger.info("Descargando página offset=%d / %d…", offset, max_offset)
        time.sleep(DELAY_BETWEEN)

        data = fetch_page(offset)
        if not data:
            logger.warning("Página vacía en offset=%d. Continuando…", offset)
            offset += PAGE_SIZE
            continue

        page_results = data.get("results", [])
        if not page_results:
            logger.info("Sin más resultados en offset=%d. Finalizando.", offset)
            break

        all_items.extend(parse_item(r) for r in page_results)
        logger.info("Acumulado: %d propiedades.", len(all_items))
        offset += PAGE_SIZE

    return all_items


def save_to_csv(properties: list[dict], filename: str) -> None:
    keys = ["title", "description", "price", "region", "comuna", "address",
            "bedrooms", "bathrooms", "sqm", "source", "source_url", "external_id"]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(properties)
    logger.info("Archivo guardado: %s (%d filas)", filename, len(properties))


if __name__ == "__main__":
    props = fetch_all_properties()
    if props:
        save_to_csv(props, CSV_OUTPUT)
        print(f"✅ Se extrajeron {len(props)} propiedades → {CSV_OUTPUT}")
    else:
        print("❌ No se pudieron extraer propiedades.")
