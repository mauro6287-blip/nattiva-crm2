# H17 — Release & Quality (CI/CD, pruebas y Definition of Done)

## Propósito
Bajar riesgo y acelerar con confianza: releases repetibles, pruebas automatizadas y una **Definition of Done** clara para que el equipo avance sin retrocesos.

## Alcance
- CI/CD con checks automáticos.
- Pruebas: contract tests de API, pruebas RLS (multi-tenant), smoke tests E2E.
- Ambientes: dev / staging / prod con configuración controlada.
- Runbook de despliegue y rollback.

## Entregables
### 1) CI/CD
- Pipeline con:
  - lint + typecheck
  - tests unitarios
  - tests de integración
  - build y deploy a staging
  - gate de promoción a prod
- Secret management: variables por entorno.

### 2) Suite de pruebas mínima (prioridad alta)
- **Contract tests API** (endpoints críticos):
  - validación/QR
  - permisos por rol
  - operaciones core del CRM (padrón, aprobaciones, tickets si aplica)
- **Pruebas RLS**:
  - casos cross-tenant (bloquear)
  - casos por rol (permitir/denegar)
- **Smoke tests E2E**:
  - login
  - navegación básica
  - bandejas (si existen)
  - aprobación
  - validación

### 3) Ambientes
- Staging con datos de prueba controlados.
- Checklist de configuración por entorno.
- Estrategia de migraciones: orden, rollback y verificación.

### 4) Definition of Done (DoD)
- Documento DoD por feature:
  - requisitos funcionales cerrados
  - seguridad (RLS/permisos) revisada
  - tests mínimos agregados
  - observabilidad (logs/métricas) en puntos críticos
  - documentación breve
  - QA y criterios de aceptación firmes

### 5) Runbook
- Guía de release:
  - pasos de deploy
  - verificación post-deploy
  - rollback
  - manejo de incidentes frecuentes

## Criterios de aceptación
- Se puede desplegar a staging y prod sin pasos manuales críticos.
- Un cambio no se considera “listo” sin tests y validación de seguridad.
- Existe un proceso claro de rollback.

## Tareas sugeridas (desglose)
- Definir pipeline y gates por entorno.
- Implementar tests contract + RLS.
- Implementar smoke E2E.
- Definir convención de versionado y changelog.
- Crear runbook y ejecutarlo en 1 release real.

## Roles
- **Tech Lead/DevOps (Owner):** CI/CD, entornos, runbook.
- **Backend:** contract tests, RLS tests.
- **Frontend:** E2E smoke y regresión UI.
- **QA:** estrategia de pruebas + ejecución.

## Riesgos / notas
- Si el pipeline es muy pesado, frena al equipo: balancear cobertura vs velocidad.
- Migraciones sin rollback planificado son un riesgo: definir estrategia desde ya.

## Definition of Done
- Pipeline funcionando (staging + prod) + suite mínima de pruebas.
- DoD publicado y aplicado a 2 features reales.
- Runbook probado y actualizado.

