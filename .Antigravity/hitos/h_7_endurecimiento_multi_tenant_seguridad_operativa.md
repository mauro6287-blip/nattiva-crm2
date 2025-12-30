# H7 — Endurecimiento multi-tenant + seguridad operativa

## Propósito
Blindar el aislamiento por **tenant**, reforzar permisos por rol y reducir superficies de riesgo en flujos críticos.

## Alcance
- Revisión y endurecimiento de **RLS/policies** por `tenant_id` y por rol.
- Revisión de endpoints críticos (validación/QR, búsquedas sensibles, exports).
- Principio de **mínimo privilegio** para proveedores/operadores.
- Manejo consistente de errores (sin filtrar datos en mensajes).

## Entregables
1. **Matriz de roles y permisos** (SuperAdmin / Sindicato / Operación / Proveedor) con acciones permitidas por módulo.
2. **Auditoría de RLS**: checklist + correcciones aplicadas (incluye pruebas cross-tenant).
3. **Rate limiting / throttling** en rutas críticas (validación/QR, endpoints de búsqueda, exports).
4. **Exposición mínima de datos** para proveedores: respuestas con campos estrictamente necesarios.
5. **Checklist de seguridad pre-release** + evidencia (capturas/logs/tests).

## Criterios de aceptación
- Ninguna consulta u operación devuelve datos fuera del `tenant_id`.
- Proveedor solo ve lo imprescindible para validar/operar (no PII extra ni data interna del sindicato).
- Endpoints críticos protegidos contra abuso (límites + logs + alertas básicas).
- Auditoría registra actor, tenant, timestamp y cambios relevantes.

## Tareas sugeridas (desglose)
- Inventario de rutas/consultas por módulo y su policy.
- Test suite de RLS: casos positivos/negativos (cross-tenant).
- Revisión de payloads de API: “campos permitidos” por rol.
- Implementación de rate limit (por IP + por usuario cuando aplique).
- Revisión de almacenamiento de secrets (env/keys) y rotación planificada.

## Roles
- **Backend (Owner):** RLS, endpoints, hardening.
- **Frontend:** UI condicionada por permisos, manejo de errores.
- **QA:** pruebas de fuga de datos, regresión de flujos críticos.
- **Operación:** validación de permisos “realistas” (lo que necesitan / lo que no).

## Riesgos / notas
- Cambios en RLS pueden afectar pantallas existentes: ejecutar regresión completa.
- Rate limiting mal calibrado puede bloquear operación: definir umbrales por rol/tenant.

## Definition of Done
- Policies revisadas + tests pasando.
- Rate limit activo en producción para rutas críticas.
- Documentación y checklist completados.

