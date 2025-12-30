# Hito 3 — Validación de convenios (evento trazable)

## Objetivo
Habilitar el uso real del beneficio: el proveedor **valida** y queda un **registro auditable**.

---

## Entregables

### 1) Base de datos
- `providers`
- `provider_users`
- `agreements` (convenios/beneficios)
- (Opcional) `provider_branches` (sucursales)
- `benefit_validations`
  - método: QR / ID socio / email
  - resultado: OK / rechazado (con motivo)
  - validador: `provider_user_id`
  - timestamps

> Todas con: `tenant_id`, `created_at`, `updated_at`, `deleted_at` + RLS.

### 2) Servicios / API
- Endpoint **Validar beneficio**:
  - recibe identificador (QR/ID/email)
  - verifica estado (verificado/ex-socio) + vigencia de convenio
  - registra evento en `benefit_validations`
  - registra evento en `audit_log` (acciones sensibles)
  - responde lo mínimo para operación (válido/no válido + motivo)

### 3) UI
- **Portal proveedor**:
  - pantalla “Validar socio”
  - historial de validaciones
- **CRM sindicato**:
  - monitoreo básico de validaciones (filtros por proveedor/fecha/resultado)

---

## Criterio de aceptación
- Un proveedor valida a un socio verificado y el evento queda registrado con trazabilidad y aislamiento por tenant.

---

## Definition of Done (DoD)
- Reglas de permisos (quién valida, quién ve historial).
- RLS validado para proveedor vs sindicato.
- Eventos registrados en auditoría.
- UI funcional para operación (sin pasos manuales extra).

