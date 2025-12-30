# H11 — Analytics v2 (métricas accionables)

## Propósito
Pasar de métricas “bonitas” a **métricas que disparan decisiones**: adopción, uso, conversión y salud operativa por tenant/proveedor.

## Alcance
- KPIs por `tenant_id`, proveedor y (si aplica) sucursal.
- Embudos (padrón → verificado → uso) y cohortes simples.
- Exportes para reportes y presentaciones.

## Entregables
### 1) Panel de KPIs (por tenant)
- **Padrón**: total, activos, bajas, cambios (si se integra con H10).
- **Verificación**: % verificados, tiempo promedio a verificación, re-verificaciones.
- **Actividad**: usuarios activos (mensual/semanal si aplica), sesiones/acciones clave.
- **Uso de convenios**: validaciones por proveedor, por tipo de beneficio.
- **Calidad operativa**: validaciones OK/Fail, top causas de fallo.

### 2) Embudos
- Padrón → Registrado app → Verificado → Uso beneficio.
- Segmentación por canal/campaña (si existe tracking).

### 3) Cohortes (simple y útil)
- Cohortes de nuevos verificados por mes y su “uso” en semanas 1–4.
- Retención básica por cohortes (si hay eventos suficientes).

### 4) Exportes
- CSV por filtros (fecha, proveedor, estado, segmento).
- “Snapshot mensual” descargable.

### 5) Señales de alerta (básicas)
- Spike de fallos por proveedor/sucursal.
- Caída abrupta de conversiones o verificaciones.

## Criterios de aceptación
- Un usuario de operación/sindicato puede responder en minutos:
  - ¿Qué proveedores se usan más?
  - ¿Dónde fallan validaciones?
  - ¿Cómo evoluciona la verificación?
- Métricas consistentes con definiciones claras (glosario) y filtros estables.

## Tareas sugeridas (desglose)
- Definir **eventos canónicos** (qué es “uso”, “validación”, “conversión”).
- Modelar tablas/vistas/materialized views para analytics.
- Implementar endpoints para dashboards (paginados y cacheables).
- UI de dashboards + filtros.
- Validación con datos reales (comparar con registros operativos).

## Roles
- **Data/Backend (Owner):** modelado, consultas, performance.
- **Frontend:** dashboards, filtros, export.
- **Operación/Sindicato:** definiciones de KPI y lectura esperada.
- **QA:** consistencia y casos borde (fechas, zonas horarias, duplicados).

## Riesgos / notas
- Sin eventos bien definidos, el dashboard se vuelve “interpretación”: crear glosario.
- Performance: cuidar agregaciones (usar vistas/materialización cuando aplique).

## Definition of Done
- Panel KPI + embudo + cohorte simple + export.
- Glosario de métricas publicado.
- Pruebas de consistencia con dataset de ejemplo.

