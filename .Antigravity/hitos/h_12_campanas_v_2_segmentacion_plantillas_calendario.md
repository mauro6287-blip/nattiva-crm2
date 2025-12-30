# H12 — Campañas v2 (segmentación + plantillas + calendario)

## Propósito
Hacer campañas **repetibles, segmentadas y medibles**: menos manualidad, más impacto y trazabilidad.

## Alcance
- Segmentación por estado/actividad (verificado, ex-socio, inactivo, por uso, por proveedor).
- Plantillas reutilizables con variables.
- Calendario y programación.
- Métricas de performance por campaña.

## Entregables
### 1) Segmentador
- Criterios mínimos:
  - Estado: verificado / no verificado / ex-socio
  - Actividad: activo / inactivo (por período)
  - Uso: usuarios que usaron/no usaron ciertos convenios
  - Proveedor: usuarios asociados a campañas de un proveedor (si aplica)
- Vista previa del tamaño del segmento (conteo).

### 2) Plantillas
- Biblioteca de plantillas (push/email):
  - variables (nombre, beneficio, fecha, etc.)
  - previsualización
  - versionado básico
- Validaciones: longitud, campos obligatorios, links.

### 3) Calendario y programación
- Programación por fecha/hora (zona horaria tenant).
- Estados de campaña: borrador → programada → enviada → pausada → cancelada.
- Aprobación (opcional por rol/política).

### 4) Tracking y reportes
- Reporte por campaña:
  - enviados
  - entregados (si aplica)
  - aperturas/clics (si aplica)
  - conversiones (si existe evento de conversión)
- Export CSV.
- Bitácora de cambios (quién editó qué).

## Criterios de aceptación
- Crear una campaña estándar toma **minutos** (segmento + plantilla + calendario).
- Queda registro completo: contenido, segmentos, fecha/hora, actor y resultados.
- Segmentación consistente y reproducible (mismas reglas = mismo segmento).

## Tareas sugeridas (desglose)
- Definir modelo de datos de campañas, segmentos y ejecuciones.
- Implementar motor de segmentación (queries/vistas + caché).
- UI: creador (wizard), biblioteca de plantillas y calendario.
- Tracking: registrar eventos de envío/resultado.
- Permisos: quién puede crear/editar/aprobar/enviar.
- QA: segmentación con casos borde y pruebas de scheduling.

## Roles
- **Producto/Marketing/Operación (Owner funcional):** define segmentos y plantillas base.
- **Backend (Owner técnico):** segmentación, scheduling, tracking.
- **Frontend:** editor, wizard, calendario, reportes.
- **QA:** validación de segmentación y scheduling.

## Riesgos / notas
- Tracking depende del canal (push/email) y proveedor de mensajería: alinear integraciones.
- Segmentos complejos pueden ser costosos: usar pre-cálculo o materialización.

## Definition of Done
- Segmentador + plantillas + calendario + reporte básico.
- Auditoría de cambios y permisos.
- 3 campañas tipo configuradas (eventos) como ejemplos.

