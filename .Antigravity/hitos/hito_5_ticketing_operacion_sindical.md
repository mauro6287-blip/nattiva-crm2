# Hito 5 — Ticketing (operación sindical)

## Objetivo
Implementar un canal de atención trazable, idealmente asociado a socio verificado (para contexto y métricas).

---

## Entregables

### 1) Base de datos
- `tickets`
  - tipo, prioridad, estado, asignado_a
  - referencia a socio/app_user cuando aplique
- `ticket_messages`
- `ticket_status_history`

> Todas con: `tenant_id`, `created_at`, `updated_at`, `deleted_at` + RLS.

### 2) Servicios / API
- Crear ticket (interno y/o desde app si se habilita).
- Responder ticket.
- Cambiar estado (abierto/en progreso/resuelto/cerrado).
- (Opcional) SLA básico.
- Auditoría de cambios sensibles (reasignaciones, cierres, etc.).

### 3) UI
- CRM: bandeja de tickets (filtros + búsqueda).
- CRM: detalle de ticket (mensajes + historial + acciones).

---

## Criterio de aceptación
- Un ticket se crea, se gestiona y queda historial completo, con aislamiento por tenant y permisos correctos.

---

## Definition of Done (DoD)
- Estados y transiciones definidas.
- RLS probado para roles.
- Auditoría registra cambios críticos.
- UI lista para operación diaria.

