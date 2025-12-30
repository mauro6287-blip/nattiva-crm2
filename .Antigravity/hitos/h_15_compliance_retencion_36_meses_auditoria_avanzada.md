# H15 — Compliance & retención (36 meses) + auditoría avanzada

## Propósito
Gobernanza total: responder “qué pasó, quién lo hizo y cuándo”, con **retención automática** y herramientas de auditoría para control interno.

## Alcance
- Políticas de retención por tipo de dato (objetivo: **36 meses**).
- Auditoría avanzada (before/after) para entidades críticas.
- Export para auditoría y control de acceso a auditoría.

## Entregables
### 1) Políticas de retención
- Definición por entidad/tabla (ejemplos):
  - logs/auditoría (36 meses)
  - validaciones (36 meses)
  - tickets (36 meses)
  - campañas (36 meses)
  - imports de padrón (resúmenes 36 meses; staging puede ser menor)
- Jobs automáticos:
  - purge/archivado según política
  - verificación y reportes de cumplimiento

### 2) Auditoría avanzada
- Registro de eventos con:
  - `tenant_id`, `actor_id`, rol
  - entidad afectada y su ID
  - acción (create/update/delete lógico)
  - timestamp
  - **before/after** (diff) para campos relevantes
- Auditoría de permisos/roles: cambios de roles, accesos, invitaciones.

### 3) Visor de auditoría
- Filtros:
  - tenant
  - actor
  - fecha
  - entidad
  - tipo de acción
- Vista:
  - timeline
  - detalle diff (campo: antes → después)

### 4) Export y controles
- Export CSV/JSON de auditoría por rango.
- Roles y permisos para auditoría (solo perfiles autorizados).
- Registro adicional: quién consultó auditoría y qué exportó (audit trail de auditoría).

## Criterios de aceptación
- Se puede reconstruir un incidente con auditoría (actor + antes/después).
- Retención se aplica automáticamente y se puede demostrar (reporte).
- Acceso a auditoría está restringido y queda trazado.

## Tareas sugeridas (desglose)
- Definir matriz de retención por entidad (con negocio/legal si aplica).
- Implementar mecanismo de auditoría (triggers/funciones/app-layer).
- Implementar jobs de retención (archivado/purge) con seguridad.
- UI visor de auditoría + export.
- QA: pruebas de retención (simuladas), permisos y consistencia del diff.

## Roles
- **Backend (Owner):** auditoría, retención, jobs.
- **Frontend:** visor y export.
- **Seguridad/Legal (si aplica):** validación de política.
- **QA:** pruebas de permisos y trazabilidad.

## Riesgos / notas
- Retención mal definida puede borrar información útil: separar “archivar” vs “eliminar”.
- Auditoría con before/after puede crecer rápido: definir campos relevantes y compresión.

## Definition of Done
- Políticas implementadas + jobs activos + reporte de cumplimiento.
- Auditoría avanzada con visor y export.
- Permisos y audit trail de consultas a auditoría.

