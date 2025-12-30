# Plan de implementación del MVP (hitos y entregables)

> Enfoque recomendado: **rebanadas verticales (feature slices)** con una **base mínima sólida** al inicio. Cada hito cierra un circuito completo: **DB + RLS + API/servicios + UI**.

---

## Hito 0 — Fundaciones (mínimo, pero impecable)

### Objetivo
Asegurar desde el día 1 el **aislamiento multi-tenant (tenant=app)**, la **seguridad (RLS)** y un entorno reproducible.

### Entregables
- **Entornos**: `dev / staging / prod` (Supabase + NextJS), variables, seeds mínimos.
- **Convenciones transversales (DB)**
  - `tenant_id` en todas las tablas relevantes.
  - `created_at`, `updated_at`.
  - **Soft delete**: `deleted_at`.
  - `created_by`, `updated_by` (o `actor_type/actor_id`) para trazabilidad.
- **Auth + Roles (mínimo viable)**
  - Usuarios internos: sindicato / operación / proveedor.
  - Tabla de roles + asignaciones.
- **RLS “esqueleto”**
  - Políticas por `tenant_id`.
  - Reglas por rol para lectura/escritura (mínimo: admin vs operador/proveedor).
- **Auditoría base**
  - `audit_log` para eventos sensibles (importaciones, verificación, validaciones, cambios de estado).

### Criterio de aceptación
- Un usuario de Tenant A **no puede** consultar ni modificar datos de Tenant B (validación con tests + verificación manual).

---

## Hito 1 — Núcleo SaaS + “Hello Tenant” (primer slice)

### Objetivo
Demostrar que el producto funciona como SaaS multi-inquilino desde la UI.

### Entregables
- **Migración núcleo**
  - `tenants` (estado, configuración base, llaves/credenciales futuras si aplica)
  - `internal_users` (vinculado a auth) + `roles` + `role_assignments`
  - `audit_log`
- **Servicios/API**
  - CRUD de tenant (protegido).
  - CRUD/invitación de usuarios internos + asignación de rol.
- **UI NextJS (Admin/Operación)**
  - Pantalla “Tenants” (crear/editar/activar).
  - Pantalla “Usuarios internos” (crear/rol).

### Criterio de aceptación
- Tenant creado, usuario asignado, y RLS validado (solo ve su tenant).

---

## Hito 2 — Padrón → Match → Verificación (corazón del MVP)

### Objetivo
Cerrar el circuito de identidad: **padrón oficial** → **match** → **usuario verificado**.

### Entregables (DB)
- `padron_imports` (cabecera: archivo, fecha, métricas de carga, estado)
- `padron_members` (socios)
- `padron_dependents` (cargas)
- `app_users` (representación del usuario de la app/GoodBarber: `goodbarber_user_id`, email(s), estado)
- `member_verifications` o `match_queue`
  - resultado: confirmado / ambiguo / no encontrado
  - campos de evidencia: email login, email corporativo, score de match, etc.

### Entregables (Servicios/API)
- Importador de padrón (CSV/Excel según defina el equipo) con:
  - validación de columnas
  - reporte de errores
  - idempotencia (evitar duplicados en recargas)
- Motor de match:
  - regla 1: email de login
  - regla 2: email corporativo
  - regla 3: cola manual de ambiguos
- Acción “Confirmar verificación”:
  - fija vínculo `goodbarber_user_id` ↔ `member_id`
  - registra en `audit_log`
- Acción “Marcar Ex-socio”:
  - estado en CRM (y futuro: sincronización a grupo GB)

### Entregables (UI NextJS)
- “Importar padrón” (subida + reporte)
- “Cola de verificación” (ambiguos + no encontrados + confirmados)
- Vista detalle socio (datos + dependientes + estado)

### Criterio de aceptación
- Un socio se importa, se matchea (automático o manual), queda **Verificado**, y el sistema puede usar ese vínculo en validaciones.

### Nota operativa (recomendación)
- **Feature flag** para “sincronizar grupos en GoodBarber”: en MVP el CRM puede **registrar estado y recomendar**, dejando lista la ruta para automatizar después.

---

## Hito 3 — Validación de convenios (evento trazable)

### Objetivo
Habilitar el uso real del beneficio: proveedor valida y queda registro auditable.

### Entregables (DB)
- `providers` (proveedores)
- `provider_users` (accesos portal proveedor)
- `agreements` (convenios/beneficios)
- (Opcional) `provider_branches` (sucursales)
- `benefit_validations`
  - método: QR / ID socio / email
  - resultado: OK / rechazado (y motivo)
  - validador (provider_user)
  - timestamps + tenant_id

### Entregables (Servicios/API)
- Endpoint “validar beneficio”:
  - recibe identificador (QR/ID/email)
  - verifica estado (verificado/ex-socio)
  - registra evento
  - responde mínimo viable para operación

### Entregables (UI)
- Portal proveedor:
  - pantalla “Validar socio”
  - historial de validaciones
- CRM sindicato:
  - monitoreo básico de validaciones

### Criterio de aceptación
- Un proveedor valida a un socio verificado y se registra el evento correctamente con auditoría.

---

## Hito 4 — Contenidos de proveedores + Aprobación delegable

### Objetivo
Que proveedores propongan contenido (convenios/eventos) y el sindicato controle publicación.

### Entregables (DB)
- `content_items` (o entidades separadas: `agreements`, `events`, etc.)
- `content_workflow`
  - estados: borrador → enviado → aprobado/rechazado → publicado → expirado
- `content_reviews` (quién aprobó, comentario, fecha)

### Entregables (Servicios/API)
- CRUD proveedor (borrador/enviar)
- Cola de aprobación (aprobar/rechazar)
- Registro en `audit_log`

### Entregables (UI)
- Portal proveedor: “Mis contenidos” (borrador → enviar)
- CRM: “Bandeja de aprobación”

### Criterio de aceptación
- Un proveedor envía un contenido, el sindicato lo aprueba y queda publicado (listo para integrarse a GoodBarber).

---

## Hito 5 — Ticketing (operación sindical)

### Objetivo
Canal de atención trazable, asociado a socio verificado.

### Entregables (DB)
- `tickets`
- `ticket_messages`
- `ticket_status_history`

### Entregables (Servicios/API)
- Crear ticket (interno/usuario app si aplica)
- Responder/cambiar estado
- SLA básico (opcional)

### Entregables (UI)
- CRM: bandeja de tickets + detalle

### Criterio de aceptación
- Un ticket se crea, se gestiona y queda historial completo.

---

## Hito 6 — Campañas por eventos + Dashboard + Endurecimiento

### Objetivo
Activar comunicación y medición; cerrar seguridad y operación para producción.

### Entregables
- **Campañas** disparadas por eventos (validación, ticket, expiración convenio, etc.)
- **Dashboard**
  - validaciones por proveedor / período
  - socios verificados vs ambiguos
  - tiempos de aprobación
- **Retención y cumplimiento**
  - política de retención (p.ej. 36 meses)
  - jobs programados (cleanup/archivado) respetando soft delete
- **Hardening**
  - rate limiting (si aplica)
  - logs estructurados
  - pruebas E2E de flujos críticos

### Criterio de aceptación
- Métricas disponibles, automatizaciones operativas mínimas y cumplimiento de retención.

---

# Reglas prácticas de implementación (para el equipo)

## Cómo trabajar (sin caer en extremos)
1. **Primero**: una migración núcleo (tenant/auth/rls/audit/soft delete).
2. **Luego**: migraciones pequeñas por hito (DB + API + UI en el mismo sprint).
3. **Siempre**: cada tabla nueva nace con `tenant_id` + timestamps + `deleted_at` + RLS.

## Definition of Done (DoD) por hito
- Migración aplicada + rollback validado (cuando sea posible).
- RLS funcionando (tests o scripts de verificación).
- Endpoints documentados (OpenAPI o README de rutas).
- UI mínima operable.
- Auditoría registrada en eventos clave.

---

# Orden recomendado (resumen)
0) Fundaciones → 1) Núcleo SaaS → 2) Padrón/Verificación → 3) Validación convenios → 4) Contenidos/Aprobación → 5) Ticketing → 6) Campañas/Dashboard/Hardening

