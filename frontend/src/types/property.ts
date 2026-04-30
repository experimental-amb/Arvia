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
}

export interface SearchFilters {
  q?: string;
  region?: string;
  comuna?: 