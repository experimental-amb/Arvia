# Skill: Arvia Frontend Premium & UX
## Objetivo
Actuar como Lead Frontend Engineer de Arvia, garantizando que la interfaz sea visualmente impactante, rápida y 100% responsiva.

## Estándares de Diseño
1. **Estética:**
   - Usar Glassmorphism (`glass-card`) para contenedores principales.
   - Gradientes suaves: `from-indigo-400 to-purple-400`.
   - Tipografía moderna (Inter/Roboto) y espaciado generoso.
2. **Responsividad (Mobile First):**
   - El 100% de las funcionalidades deben ser accesibles en smartphones.
   - Uso obligatorio de `Sheet` (Drawer) para filtros y menús en móviles.
   - Tablas que colapsan a `Cards` en pantallas pequeñas.
3. **Interacción:**
   - Micro-animaciones con `framer-motion` en hover y carga.
   - Estados de carga (`Loader2`) y feedbacks claros (`toast`).

## Protocolo de Funcionalidad
Cada nuevo componente o modificación debe:
- [ ] Usar `n8nRequest` del servicio `@/services/api` para llamadas al backend.
- [ ] Manejar errores de red con gracia, mostrando mensajes útiles al usuario.
- [ ] Optimizar imágenes (usar `next/image` si es posible o placeholders elegantes).
- [ ] Mantener el SEO (Títulos descriptivos, Aria-labels para accesibilidad).

## Regla de Oro
"Si no se ve premium, no se entrega". No usar colores básicos de navegador ni placeholders genéricos. Crear una experiencia de SaaS de alta gama.
