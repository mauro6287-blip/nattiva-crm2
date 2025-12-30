# Hito 2 — Padrón → Match → Verificación

## Objetivo
Cerrar el circuito de identidad: **padrón oficial** → **match** → **usuario verificado** (corazón del MVP).

---

## Entregables

### 1) Base de datos
- `padron_imports`
  - archivo/origen, fecha, estado, métricas (total, válidos, inválidos)
- `padron_members` (socios)
- `padron_dependents` (cargas)
- `app_users`
  - `goodbarber_user_id`
  - email(s)
  - estado
- `member_verifications` (o `match_queue`)
  - resultado: confirmado / ambiguo / no encontrado
  - evidencia: email_login, email_corporativo, score/regla aplicada
  - operador que resolvió (si fue manual)

> Todas con: `tenant_id`, `created_at`, `updated_at`, `deleted_at` + RLS.

### 2) Servicios / API
- **Importador de padrón** (CSV/Excel según definición):
  - validación de columnas
  - reporte de errores por fila
  - idempotencia (evitar duplicados en recargas)
- **Motor de match**:
  - regla 1: email de login
  - regla 2: email corporativo
  - regla 3: cola manual de ambiguos
- **Confirmar verificación**:
  - fija vínculo `goodbarber_user_id` ↔ `member_id`
  - registra evento en `audit_log`
- **Marcar Ex-socio**:
  - cambia estado en CRM
  - deja trazabilidad

### 3) UI NextJS
- Pantalla **Importar padrón** (subida + resumen + errores).
- Pantalla **Cola de verificación** (ambiguos/no encontrados/confirmados).
- **Detalle de socio**: datos + dependientes + estado + acciones.

---

## Criterio de aceptación
- Un socio se importa, se matchea (automático o manual), queda **Verificado**, y ese vínculo se usa en el resto del MVP.

---

## Nota (recomendación para MVP)
- Implementar “estado” (Verificado/Ex-socio) en CRM y dejar la sincronización de grupos en GoodBarber detrás de un **feature flag** (recomendación vs automatización).

---

## Definition of Done (DoD)
- Importación con reporte y manejo de errores.
- Match automático + cola manual funcionando.
- RLS y permisos por rol (quién puede verificar y marcar ex-socio).
- Auditoría registra: importación, match resuelto, cambios de estado.

