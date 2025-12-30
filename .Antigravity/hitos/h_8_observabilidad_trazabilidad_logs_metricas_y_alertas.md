# H8 — Observabilidad + trazabilidad (logs, métricas y alertas)

## Propósito
Que el CRM sea operable en producción: diagnosticar fallos rápido, medir salud del sistema y trazar acciones por usuario/tenant.

## Alcance
- Logging estructurado con contexto mínimo: `tenant_id`, `actor_id`, `role`, `request_id`, `resource`, `action`.
- Métricas por flujo: validaciones, aprobaciones, imports, campañas, tickets (si aplica).
- Alertas por error rate, integraciones fallidas y colas atascadas.
- Registro de reintentos y fallos con causa raíz probable.

## Entregables
1. **Estándar de logs** (formato JSON) + guía:
   - niveles (info/warn/error)
   - campos obligatorios
   - sanitización de datos (no PII innecesaria)
2. **Tablero “Salud del sistema”** (operación) con:
   - Integraciones OK/Fail
   - Validaciones OK/Fail
   - Tiempos de respuesta p50/p95
   - Top errores (últimas 24h/7d)
3. **Alertas mínimas**:
   - aumento de errores 5xx
   - p95 alto sostenido
   - spike de validaciones fallidas
   - job/cola fallida o atascada
4. **Registro de reintentos** (por evento) con:
   - cantidad de intentos
   - backoff
   - estado final
   - último error
5. **Runbook de incidentes**:
   - señales
   - diagnóstico
   - pasos de mitigación
   - escalamiento

## Criterios de aceptación
- Ante un incidente, se puede:
  - identificar **tenant afectado**
  - ver **actor** y **acción**
  - reproducir el flujo (o su traza)
  - encontrar el punto de fallo
- Alertas disparan con umbrales definidos y no generan ruido excesivo.
- Operación puede revisar tablero diario y detectar degradación antes de que “explote”.

## Tareas sugeridas (desglose)
- Definir lista de eventos auditables por módulo.
- Instrumentar endpoints críticos con `request_id` y duración.
- Agregar “correlation id” a integraciones.
- Definir umbrales por entorno (stg vs prod).
- Revisión de privacidad: evitar logs con datos sensibles.

## Roles
- **Backend/DevOps (Owner):** instrumentación, métricas, alertas.
- **Frontend:** registro de errores UI (opcional) y trazas de navegación críticas.
- **Operación:** definición de señales útiles + revisión de runbook.
- **QA:** pruebas de trazabilidad (que cada acción crítica deje rastro).

## Riesgos / notas
- Exceso de logs = costo/ruido: aplicar muestreo donde corresponda.
- Falta de correlación entre sistemas: asegurar `request_id` transversal.

## Definition of Done
- Logs estructurados + tablero + alertas activas.
- Runbook publicado y probado con un “simulacro” simple.

