import type { Property } from "@/types/property";

/**
 * Seed data mirrors InitCore's init.sql shape (Viña del Mar, La Serena,
 * Santiago metropolitan communes). Images are Unsplash CDN.
 */
export const mockProperties: Property[] = [
  {
    id: "prop-001",
    title: "Depto con vista al mar en Reñaca",
    description:
      "Amplio departamento de 3 dormitorios a pasos de la playa. Edificio con piscina, gimnasio y quincho. Ideal para familia o inversión turística.",
    price: 210_000_000,
    currency: "CLP",
    region: "Valparaíso",
    comuna: "Viña del Mar",
    address: "Av. Borgoño 14200",
    bedrooms: 3,
    bathrooms: 2,
    sqm: 92,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
    ],
    status: "active",
    createdAt: "2026-03-04T10:20:00Z",
    aiSummary:
      "Mejor opción para quien busca vista al mar y plusvalía. Ubicación top, layout eficiente.",
    tags: ["Vista al mar", "Piscina", "Estacionamiento"],
  },
  {
    id: "prop-002",
    title: "Casa mediterránea en La Serena",
    description:
      "Casa de 2 pisos en condominio cerrado. Jardín con quincho, 4 dormitorios y suite principal. A 10 min de la playa.",
    price: 185_000_000,
    currency: "CLP",
    region: "Coquimbo",
    comuna: "La Serena",
    address: "Calle Los Almendros 456",
    bedrooms: 4,
    bathrooms: 3,
    sqm: 160,
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
    ],
    status: "active",
    createdAt: "2026-03-10T14:00:00Z",
    aiSummary: "Ideal familia. Barrio tranquilo, colegios cerca y buena conectividad.",
    tags: ["Condominio", "Jardín", "Quincho"],
  },
  {
    id: "prop-003",
    title: "Loft minimalista en Providencia",
    description:
      "Loft de diseño, cocina abierta y ventanales de piso a techo. Edificio con rooftop y co-working. A 2 cuadras del metro.",
    price: 135_000_000,
    currency: "CLP",
    region: "Metropolitana",
    comuna: "Providencia",
    address: "Av. Pocuro 2800",
    bedrooms: 1,
    bathrooms: 1,
    sqm: 48,
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
    ],
    status: "active",
    createdAt: "2026-03-12T09:15:00Z",
    aiSummary: "Inversión AirBnB con alta demanda. Flujo estimado 0.7% mensual.",
    tags: ["Metro", "Rooftop", "Co-working"],
  },
  {
    id: "prop-004",
    title: "Penthouse con terraza en Las Condes",
    description:
      "Penthouse de 4 dormitorios, terraza de 40 m², piscina privada y vista a la cordillera. Conserjería 24/7.",
    price: 680_000_000,
    currency: "CLP",
    region: "Metropolitana",
    comuna: "Las Condes",
    address: "Av. Apoquindo 5400",
    bedrooms: 4,
    bathrooms: 4,
    sqm: 240,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200",
      "https://images.unsplash.com/photo-1600566753104-685f4f24cb4d?w=1200",
    ],
    status: "active",
    createdAt: "2026-02-20T16:45:00Z",
    aiSummary: "Segmento premium. Vista cordillera es un diferenciador de largo plazo.",
    tags: ["Penthouse", "Piscina", "Vista cordillera"],
  },
  {
    id: "prop-005",
    title: "Casa de campo en Algarrobo",
    description:
      "Casa rústica sobre 2000 m² de terreno. 3 dormitorios, estufa a leña, huerto y acceso privado a caleta.",
    price: 145_000_000,
    currency: "CLP",
    region: "Valparaíso",
    comuna: "Algarrobo",
    address: "Camino Costero km 3",
    bedrooms: 3,
    bathrooms: 2,
    sqm: 130,
    images: [
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200",
      "https://images.unsplash.com/photo-1472224371017-08207f84aaae?w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
    ],
    status: "reserved",
    createdAt: "2026-01-28T11:30:00Z",
    aiSummary: "Segunda vivienda de fin de semana. Terreno grande con potencial de subdivisión.",
    tags: ["Terreno amplio", "Playa cerca"],
  },
  {
    id: "prop-006",
    title: "Oficina corporativa en El Golf",
    description:
      "Oficina A+ 180 m², 4 estaciones de trabajo, 2 salas de reunión. Edificio LEED Gold.",
    price: 295_000_000,
    currency: "CLP",
    region: "Metropolitana",
    comuna: "Las Condes",
    address: "Isidora Goyenechea 3000",
    bedrooms: 0,
    bathrooms: 2,
    sqm: 180,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200",
    ],
    status: "active",
    createdAt: "2026-03-18T08:00:00Z",
    aiSummary: "Uso corporativo. Tasa de ocupación del sector supera el 92%.",
    tags: ["Comercial", "LEED", "El Golf"],
  },
];

export function findPropertyById(id: string): Property | undefined {
  return mockProperties.find((p) => p.id === id);
}
