# MEMORIA TÉCNICA ARVIA — HISTORIAL DE VERSIONES v2.x
> **Última Actualización:** 2026-05-01 03:40
> **Estado:** Fase de estabilización v2.1.x activa.

---

## 📈 1. CONTROL DE VERSIONES (JSON)

| Versión | Archivo | Descripción de Cambios / Mejoras | Estado |
|---|---|---|---|
| **v2** | `web_api_workflow_v2.json` | Versión base original. | 🟢 Base |
| **v2.1.0** | `web_api_workflow_v2.1.0.json` | Fix de SQL Dinámico para carga masiva + ID Real + Published Status. | 🟢 Estable |
| **v2.1.1** | `workflow_properties.json` | Integración final: SQL Dinámico + Limpieza Anti-NaN + Hardened Auth. | 🔵 Actual |

---

## 🛠️ 2. ESTADO DE LOS BUGS (v2.1.0)

### ✅ Arreglado en v2.1.0:
- **Carga de 150:** Ahora se guardan físicamente en la DB usando el motor de SQL Dinámico.
- **Precios NaN:** Se implementó limpieza de caracteres no numéricos en n8n antes de guardar.
- **Visibilidad:** Se fuerza el `userId` correcto en las peticiones de Stats y Listado.

### ⚠️ Pendiente de Validación:
- **Caché de Vercel:** Si después de cargar el JSON v2.1.0 y subir el CSV sigues viendo 0, hay que revisar la caché del navegador o las variables de entorno en Vercel.

---

## 🚀 INSTRUCCIONES DE CARGA:
1. Usar siempre el archivo con el número de versión más alto (actualmente **v2.1.0**).
2. Documentar cualquier cambio nuevo como **v2.1.1**.

---
**Nota:** No borrar este archivo. Es el registro oficial del progreso.
