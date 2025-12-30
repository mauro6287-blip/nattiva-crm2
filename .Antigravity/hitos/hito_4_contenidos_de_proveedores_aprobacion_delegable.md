# Hito 4 — Contenidos de proveedores + Aprobación delegable

## Objetivo
Permitir que proveedores propongan contenido (convenios/eventos) y que el sindicato controle la publicación mediante un **workflow**.

---

## Entregables

### 1) Base de datos
- `content_items` (o entidades separadas si se decide: convenios/eventos/noticias)
- `content_workflow`
  - estados: borrador → enviado → aprobado/rechazado → publicado → expirado
- `content_reviews`
  - quién aprobó/rechazó
  - comentario
  - fecha

> Todas con: `tenant_id`, `created_at`, `updated_at`, `deleted_at` + RLS.

### 2) Servicios / API
- CRUD de contenido para proveedor:
  - crear borrador
  - editar
  - enviar a revisión
- Cola de revisión para sindicato:
  - aprobar/rechazar
  - comentarios
- Registro en `audit_log`:
  - envío, aprobación, rechazo, publicación

### 3) UI
- **Portal proveedor**:
  - “Mis contenidos” (borrador → enviar)
  - estado visible + feedback de revisión
- **CRM sindicato**:
  - “Bandeja de aprobación”
  - filtros por proveedor/estado/fecha

---

## Criterio de aceptación
- Un proveedor envía un contenido, el sindicato lo aprueba y queda “publicado” (listo para integrarse a GoodBarber).

---

## Definition of Done (DoD)
- Workflow consistente (no saltos inválidos de estado).
- Permisos claros proveedor vs sindicato.
- Auditoría completa del ciclo.
- UI permite operar de punta a punta sin soporte técnico.

