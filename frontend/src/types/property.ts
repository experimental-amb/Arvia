/**
 * Property contract — espeja la tabla `properties` de PostgreSQL.
 *
 * Status en DB:  published | draft | archived
 * (legacy frontend usaba: active | draft | sold | reserved)
 * Mantenemos ambos sets para compatibilidad, mapeando published → active.
 */
export type PropertyStatus =
  | "published"   // visible en el portal (DB value)
  | "draft"       // oculta / borrador (DB value)
  | "archived"    // archivada (DB value)
  | "active"      // alias legacy de "published"
  | "sold"
  | "reserved";

export interface Property {
  id: string;
  userId?: string;
  title: string;
  description: string;
  price: number;
  currency?: "CLP" | "USD" | "UF";
  region: string;
  comuna: string;
  address?: string;
  bedrooms: number;
  bathrooms: number;
  sqm: number;
  images: string[];
  status?: PropertyStatus;
  property_type?: "departamento" | "casa" | "terreno" | "comercial" | "otro";
  transaction_type?: "venta" | "arriendo";
  createdAt?: string;
  aiSummary?: string;
  tags?: string[];
  investment?: {
    capRate?: number;
    plusvalia?: number;
    verdict?: string;
    risk?: "bajo" | "medio" | "alto";
  };
}

export interface SearchFilters {
  q?: string;
  region?: string;
  comuna?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSqm?: number;
  maxSqm?: number;
}

export interface SearchResult {
  items: Property[];
  total: number;
  query: string;
  aiSummary?: string;
}
