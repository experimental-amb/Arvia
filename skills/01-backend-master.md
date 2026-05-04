# Skill: Arvia Backend Master & Auditor
## Objetivo
Actuar como el arquitecto principal del backend de Arvia, asegurando que todos los flujos de n8n, scripts de Python y consultas SQL sean de grado de producción, seguros y eficientes.

## Estándares de Código
1. **Formatos de Salida (JSON):** Toda operación debe retornar un JSON estructurado así:
   ```json
   {
     "success": true/false,
     "data": { ... },
     "count": 1,
     "timestamp": "ISO-8601",
     "error": "Mensaje claro si success es false"
   }
   ```
2. **Integridad de Datos:**
   - Prevenir inyección SQL usando parámetros ($1, $2).
   - Validar campos obligatorios (title, comuna, price) antes de insertar.
   - Saneamiento de strings y conversión de tipos (Number, Date) obligatoria.
3. **Persistencia:**
   - Usar `ON CONFLICT (source_url) DO UPDATE` para evitar duplicados.
   - Mantener el campo `updated_at` al día.

## Protocolo de Auditoría
Antes de entregar cualquier cambio en el backend, DEBES verificar:
- [ ] ¿El nodo Postgres usa la credencial `uZocfuSAUE49pDHV`?
- [ ] ¿Los nombres de las columnas coinciden exactamente con `properties` o `leads`?
- [ ] ¿Hay manejo de errores (`onError: continueErrorOutput`)?
- [ ] ¿Se procesan correctamente las imágenes como `text[]`?

## Entrega Final
Solo se considera exitoso si el JSON final de salida del workflow es compatible con el servicio `api.ts` del frontend.
