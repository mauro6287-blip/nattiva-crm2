# H9 — Backoffice de Operación (bandejas + trabajo diario)

## Propósito
Convertir el CRM en el **centro de mando**: menos “navegar pantallas”, más resolver casos desde **bandejas operativas** con acciones rápidas.

## Alcance
- Creación de bandejas/colas de trabajo para los flujos más frecuentes.
- Filtros avanzados por tenant, estado, fechas, proveedor y responsable.
- Acciones rápidas y auditables desde la misma bandeja.

## Entregables
### 1) Bandejas operativas
- **Match ambiguo** (padrón vs registro en app):
  - sugerencias de match (por ID/correo/nombre)
  - acciones: confirmar, descartar, fusionar, crear caso
- **Aprobaciones pendientes**:
  - contenidos/proveedores/convenios/campañas (según aplique)
  - acciones: aprobar, rechazar, solicitar cambios
- **Validaciones fallidas** (QR/ID/correo):
  - detalle del intento, causa probable
  - acciones: reintentar, marcar como fraude, escalar a ticket
- **Tickets** (si ya existe):
  - backlog, en curso, bloqueados, resueltos
  - acciones: asignar, priorizar, cambiar estado, comentar

### 2) UX de operación
- Filtros: `tenant`, estado, fechas, proveedor, sucursal (si existe), usuario, prioridad.
- Ordenamiento: antigüedad, impacto, recurrencia.
- Acciones rápidas con confirmación.
- Vistas: lista + detalle lateral (panel) para resolver sin salir.

### 3) Auditoría y trazabilidad
- Cada acción genera registro: actor, tenant, timestamp, antes/después.

## Criterios de aceptación
- Operación puede resolver **≥80%** de casos frecuentes desde bandejas (sin recorrer 5 pantallas).
- Tiempo promedio de resolución de casos recurrentes baja (comparado a baseline).
- Toda acción crítica queda auditada.

## Tareas sugeridas (desglose)
- Definir “top 10” casos operativos reales y mapearlos a bandejas.
- Diseñar estados por bandeja (p. ej. nuevo/en revisión/resuelto).
- Implementar endpoints y queries optimizadas por filtros.
- Implementar UI: tabla + panel de detalle + acciones.
- Agregar permisos por rol (quién puede aprobar, reasignar, etc.).
- QA: pruebas por rol + regresión.

## Roles
- **Product/Operación (Owner funcional):** define bandejas y reglas.
- **Frontend (Owner técnico UI):** UX de bandejas.
- **Backend:** queries/indices/performance + endpoints.
- **QA:** pruebas de flujo y permisos.

## Riesgos / notas
- Si las queries no están indexadas, habrá lentitud: definir índices con datos reales.
- Evitar “bandejas gigantes”: usar estados y filtros por defecto.

## Definition of Done
- Bandejas implementadas + acciones rápidas + auditoría.
- Filtros y permisos por rol.
- Documentación de uso para operación (mini manual).

