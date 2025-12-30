# H14 — Ticketing v2 (SLA + productividad)

## Propósito
Soporte medible y escalable: ordenar demanda, responder más rápido y aprender de los casos con **SLA**, productividad y reportes.

## Alcance
- Priorización, categorías y SLA por tipo de caso.
- Macros/respuestas rápidas, etiquetas y adjuntos.
- Reportes operativos (tiempos, backlog, tendencias).

## Entregables
### 1) Modelo de ticket robusto
- Campos mínimos:
  - categoría, subcategoría
  - prioridad (baja/media/alta/urgente)
  - SLA (tiempo a primera respuesta / tiempo a resolución)
  - estado (nuevo/en curso/espera cliente/bloqueado/resuelto/cerrado)
  - responsable y equipo
  - relación (socio/proveedor/sucursal/campaña) si aplica

### 2) Productividad
- **Macros** / respuestas rápidas (plantillas):
  - variables
  - selección por categoría
- **Etiquetas** y búsqueda avanzada.
- Adjuntos (con control de tamaño y tipo).

### 3) Gestión de SLA
- Cálculo de vencimiento y semáforo (en tiempo / por vencer / vencido).
- Reglas de pausas (p. ej. “espera cliente” pausa SLA).
- Alertas internas (opcional): tickets vencidos o próximos a vencer.

### 4) Reportes
- Tiempo a primera respuesta, tiempo a resolución.
- Backlog por categoría/prioridad/tenant.
- Tendencias semanales/mensuales.
- Export CSV.

### 5) Auditoría
- Historial completo: cambios de estado, asignaciones, comentarios, ediciones.

## Criterios de aceptación
- Operación puede ver y actuar sobre tickets **por prioridad y SLA**.
- Los reportes permiten identificar cuellos de botella (categorías recurrentes, tiempos altos).
- El ticket guarda trazabilidad completa (sin “agujeros”).

## Tareas sugeridas (desglose)
- Definir catálogo de categorías + SLA por categoría/prioridad.
- Implementar cálculo de SLA + semáforos.
- Implementar macros y biblioteca.
- UI: bandeja de tickets, detalle, timeline, adjuntos.
- Reportes y export.
- QA: casos borde (pausas, re-aperturas, cambios de prioridad, multi-tenant).

## Roles
- **Operación/Soporte (Owner funcional):** categorías, SLA, macros.
- **Backend (Owner técnico):** reglas SLA, auditoría, reportes.
- **Frontend:** UX tickets + timeline + búsqueda.
- **QA:** validación de estados, SLA y permisos.

## Riesgos / notas
- SLA sin reglas claras se vuelve “decorativo”: acordar definiciones antes.
- Evitar que macros generen respuestas incorrectas: revisión y versionado.

## Definition of Done
- Ticketing con SLA operativo + macros + reportes.
- Auditoría completa y permisos por rol.
- Reporte semanal listo para descargar.

