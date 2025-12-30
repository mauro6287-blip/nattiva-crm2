# H16 — Onboarding de tenants (escalado comercial)

## Propósito
Activar un nuevo sindicato/tenant en **horas, no días**: configuración guiada, validaciones y plantillas para repetir el proceso sin fricción.

## Alcance
- Wizard de alta y configuración de tenant.
- Checklist automatizado de activación.
- Plantillas iniciales (campañas, categorías de tickets, contenido base si aplica).
- Datos demo para pruebas (staging).

## Entregables
### 1) Wizard de alta tenant
- Pasos sugeridos:
  1. Datos del tenant (nombre, identificador, contacto).
  2. Configuración de integración (App ID / API key / endpoints).
  3. Roles y usuarios iniciales (admin sindicato, operación, etc.).
  4. Parámetros: zona horaria, políticas (aprobaciones, retención), etc.
  5. Validaciones finales + “activar tenant”.

### 2) Checklist de activación
- Validaciones automáticas:
  - integración conectada
  - grupos esenciales creados (p. ej. Verificado/Ex-socio)
  - padrón cargado o listo
  - proveedores iniciales (si aplica)
- Estado del tenant: borrador → configurado → activo.

### 3) Plantillas y configuración base
- Campañas: 2–3 campañas tipo (bienvenida, evento, recordatorio).
- Tickets: categorías y SLAs base.
- Contenido base (si aplica): secciones/etiquetas estándar.

### 4) Demo data (opcional pero recomendado)
- Dataset de prueba para validar:
  - verificación
  - validaciones
  - dashboards
- Botón: “cargar demo data” (solo en dev/stg).

### 5) Documentación mínima
- Guía breve de onboarding (pasos + troubleshooting).

## Criterios de aceptación
- Un nuevo tenant se configura con wizard sin pasos manuales ocultos.
- No se puede activar si faltan requisitos críticos.
- Onboarding deja evidencia: quién creó, cuándo, con qué parámetros.

## Tareas sugeridas (desglose)
- Definir entidad/config de tenant (parámetros y defaults).
- Implementar wizard UI + validaciones.
- Implementar provisioning (creación de recursos y defaults).
- Checklist automatizado + estados.
- QA: onboarding completo + casos de error (keys inválidas, pasos incompletos).

## Roles
- **Producto/Operación (Owner funcional):** define checklist y defaults.
- **Backend (Owner técnico):** provisioning, validaciones, estados.
- **Frontend:** wizard, UX de validaciones.
- **QA:** pruebas del flujo end-to-end.

## Riesgos / notas
- Integraciones externas pueden fallar por intermitencia: incluir reintentos y diagnóstico.
- Defaults mal elegidos generan soporte: mantener plantillas “mínimas y seguras”.

## Definition of Done
- Wizard + checklist + plantillas base.
- Activación bloqueada si faltan prerequisitos.
- Documentación breve y pruebas completas.

