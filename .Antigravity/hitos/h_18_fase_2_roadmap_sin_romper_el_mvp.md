# H18 — Fase 2 (roadmap) sin romper el MVP

## Propósito
Preparar el crecimiento: definir la siguiente ola de valor sin comprometer estabilidad, con medición clara y activación gradual por tenant.

## Alcance
- Roadmap priorizado (impacto/esfuerzo/riesgo).
- Iniciativas preparadas como épicas listas para comenzar.
- Mecanismo de feature flags para activar por tenant.
- Métricas de éxito por iniciativa.

## Entregables
### 1) Roadmap priorizado
- Matriz por iniciativa:
  - objetivo
  - usuario beneficiado (sindicato/proveedor/socio/operación)
  - impacto esperado
  - esfuerzo estimado
  - riesgos
  - dependencias

### 2) Definición de métricas de éxito
- Por iniciativa:
  - KPI principal
  - KPI secundarios
  - umbral de éxito
  - ventana de medición (4–8 semanas)

### 3) Feature flags por tenant
- Modelo de configuración:
  - flags por tenant
  - rollout gradual
  - kill switch
- Auditoría: quién activó/desactivó, cuándo y por qué.

### 4) 2–3 épicas de fase 2 listas
Ejemplos (ajustables según visión):
- **Recomendaciones / IA (RAG)** para soporte operativo o sugerencias de contenido.
- **UGC + moderación** (si se habilita contenido generado por usuarios).
- **Analítica avanzada** (segmentación predictiva o anomalías más sofisticadas).
- **Automatizaciones** (reglas de negocio: si X entonces Y).

Cada épica debe incluir:
- alcance, user stories
- criterios de aceptación
- riesgos
- definición de eventos/métricas

### 5) Plan de experimentación (controlado)
- Diseño de experimento (A/B o cohortes por tenant)
- criterios de parada (stop)
- plan de rollback

## Criterios de aceptación
- Existe un roadmap defendible y medible.
- Cada épica tiene definición de éxito y plan de rollout.
- Se puede activar/desactivar features por tenant sin deploy urgente.

## Tareas sugeridas (desglose)
- Workshop de priorización (producto + operación + tech lead).
- Refinamiento: convertir top iniciativas en épicas.
- Definir feature flags y configuración tenant.
- Definir tracking de eventos para medir cada épica.

## Roles
- **Producto (Owner):** priorización, métricas, épicas.
- **Tech Lead:** arquitectura y feature flags.
- **Operación/Sindicato:** validación de valor y riesgos.
- **QA:** estrategia para rollout gradual y regresión.

## Riesgos / notas
- Fase 2 sin métricas se vuelve “feature factory”: medir o no construir.
- Rollouts sin kill switch son riesgo: feature flags sí o sí.

## Definition of Done
- Roadmap priorizado + 2–3 épicas listas.
- Feature flags diseñadas e implementadas (mínimo viable).
- Métricas de éxito definidas y trackeables.

