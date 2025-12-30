# Hito 0 — Fundaciones (mínimo, pero impecable)

## Objetivo
Asegurar desde el día 1 el **aislamiento multi-tenant (tenant=app)**, la **seguridad (RLS)** y un entorno reproducible.

---

## Entregables

### 1) Entornos
- Supabase + NextJS en `dev / staging / prod`.
- Variables de entorno + configuración base.
- Seeds mínimos (tenant demo, usuario admin demo).

### 2) Convenciones transversales (DB)
- `tenant_id` en todas las tablas relevantes.
- `created_at`, `updated_at`.
- **Soft delete**: `deleted_at`.
- Trazabilidad de actor: `created_by`, `updated_by` (o `actor_type/actor_id`).

### 3) Auth + Roles (mínimo viable)
- Usuarios internos: sindicato / operación / proveedor.
- Tabla de roles + asignaciones.

### 4) RLS “esqueleto”
- Políticas por `tenant_id`.
- Reglas por rol para lectura/escritura (mínimo: admin vs operador/proveedor).

### 5) Auditoría base
- `audit_log` para eventos sensibles:
  - importaciones
  - verificación de socio
  - validaciones de beneficio
  - cambios de estado y permisos

---

## Criterio de aceptación
- Un usuario de **Tenant A** **no puede** consultar ni modificar datos de **Tenant B** (validación manual + tests).

---

## Definition of Done (DoD)
- Migración aplicada + rollback validado (cuando sea posible).
- RLS funcionando (tests o scripts de verificación).
- Endpoints/acciones documentadas (README u OpenAPI).
- Auditoría registra eventos clave.

