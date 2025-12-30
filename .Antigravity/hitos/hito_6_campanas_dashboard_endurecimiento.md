# Hito 6 — Campañas + Dashboard + Endurecimiento

## Objetivo
Activar comunicación y medición; cerrar seguridad y operación para producción.

---

## Entregables

### 1) Campañas por eventos
- Disparadores (ejemplos):
  - validación de beneficio
  - ticket creado/resuelto
  - convenio por expirar
- Registro de envíos y resultados (si aplica).

### 2) Dashboard (métricas núcleo)
- Validaciones por proveedor / período / resultado.
- Socios verificados vs ambiguos/no encontrados.
- Tiempos de aprobación de contenidos.
- Volumen de tickets y tiempos de resolución.

### 3) Retención y cumplimiento
- Política de retención (p.ej. 36 meses) implementada.
- Jobs programados (cleanup/archivado) respetando `deleted_at`.

### 4) Hardening
- Rate limiting (si aplica).
- Logs estructurados.
- Tests E2E para flujos críticos:
  - Importar padrón → verificar socio
  - Validar beneficio
  - Workflow de contenidos
  - Ticketing

---

## Criterio de aceptación
- Métricas disponibles, automatizaciones operativas mínimas, retención en marcha y flujos críticos testeados.

---

## Definition of Done (DoD)
- Dashboards consistentes con fuentes de verdad (tablas de eventos).
- Jobs monitorizados (alertas básicas si fallan).
- E2E pasando en staging.
- Checklist de seguridad revisado (roles, RLS, auditoría).

