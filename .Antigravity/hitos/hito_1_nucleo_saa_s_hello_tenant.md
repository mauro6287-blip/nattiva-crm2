# Hito 1 — Núcleo SaaS + “Hello Tenant”

## Objetivo
Demostrar que el producto funciona como **SaaS multi-inquilino** desde la UI (primer slice completo).

---

## Entregables

### 1) Base de datos (migración núcleo)
- `tenants`
  - estado (activo/inactivo)
  - configuración base
  - campos para llaves/credenciales futuras (si aplica)
- `internal_users` (vinculado a Auth de Supabase)
- `roles`
- `role_assignments`
- `audit_log`

### 2) Servicios / API
- CRUD de tenant (solo roles autorizados).
- CRUD / invitación de usuarios internos + asignación de rol.
- Validación explícita de `tenant_id` en cada operación.

### 3) UI NextJS (Admin/Operación)
- Pantalla **Tenants**: crear / editar / activar.
- Pantalla **Usuarios internos**: crear / asignar rol.
- Verificación visible de sesión/rol (mínimo: header con tenant + rol).

---

## Criterio de aceptación
- Tenant creado, usuario asignado al tenant, y **RLS validado** (solo ve su tenant).

---

## Definition of Done (DoD)
- Migración aplicada + verificación de constraints.
- RLS validado por roles.
- Endpoints documentados.
- UI operable (mínimo viable, sin deuda de bloqueo).
- Auditoría registra: creación/edición de tenant y usuarios.

