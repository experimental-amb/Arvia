/**
 * Property contract — mirrors the InitCore `properties` table.
 * Matches columns in init.sql: id, user_id, title, description, price, region,
 * comuna, address, bedrooms, bathrooms, sqm, images JSONB, created_at.
 */
export type PropertyStatus = "active" | "draft" | "sold" | "reserved";

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
  createdAt?: string;
  /** Optional hints surfaced in AI-generated cards. */
  aiSummary?: string;
  tags?: string[];
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
  /** AI-crafted summary of results (from n8n / LLM). */
  aiSummary?: string;
}
