# Arvia Workflows — Architecture

Cada workflow es independiente y tiene su propio webhook path.

## Workflows

| Archivo | Path webhook | Proposito |
|---------|-------------|-----------|
| workflow_properties.json | /webhook/arvia-properties | CRUD completo de propiedades |
| workflow_ai_search.json  | /webhook/arvia-ai-search  | Busqueda semantica con GPT-4o-mini |

## Por que se separo del monolito

El workflow unico (web_api_workflow_v12.json) tenia 9 ramas en un solo Switch.
Problema: un error en cualquier nodo rompe TODO el workflow.

Con workflows separados:
- Cada dominio puede activarse/desactivarse independientemente
- Los errores son aislados (un fallo en AI no baja el CRUD)
- Mas facil de debuggear (execution log por dominio)
- Permite escalar workers por dominio si es necesario

## Migracion desde v12

1. Importar ambos workflows en n8n
2. Configurar credenciales Postgres en cada workflow
3. Activar ambos workflows
4. Actualizar en Vercel: agregar las nuevas URLs de webhook si son distintas
   o mantener el workflow monolitico como fallback mientras se valida

## Configuracion de credenciales Postgres

En cada nodo Postgres, seleccionar la misma credencial que usas actualmente.
Host: postgres (Docker) o IP/dominio del servidor de BD.
