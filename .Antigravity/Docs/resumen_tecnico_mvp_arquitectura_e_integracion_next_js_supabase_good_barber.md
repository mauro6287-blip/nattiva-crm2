# Resumen técnico del MVP

## Objetivo de la etapa
Definir **cómo se construye el MVP** (arquitectura, datos, seguridad e integraciones) para que el desarrollo sea directo, trazable y sin ambigüedades.

---

## 1) Arquitectura end-to-end
- **Frontend/Admin**: NextJS (panel CRM + portal interno + vistas operativas).
- **Backend/DB**: Supabase (Auth + Postgres + Storage + Edge Functions).
- **App Sindicatos**: GoodBarber (app, grupos de usuarios, custom code, feeds).
- **Multi-inquilino (tenant=app)**: el “tenant” se define por aplicación; cada tenant tiene su **APP ID**/credenciales y datos aislados.
- Entregable: diagrama **C4** (Contexto/Contenedores/Componentes) y límites claros de responsabilidad.

---

## 2) Modelo de datos (Postgres/Supabase) + Multi-tenant
- **ERD del MVP** con entidades base:
  - `tenants (apps)`, `usuarios_internos`, `roles_permisos`
  - `socios`, `padron_importaciones`, `match_verificacion`, `estados_socio`
  - `proveedores`, `convenios`, `validaciones_uso` (eventos)
  - `contenidos` + `aprobaciones`, `tickets`, `campañas_eventos`, `auditoria`
- Convenciones: `tenant_id` en tablas, estados, timestamps, actor.
- **RLS por tenant y rol** como primera línea de aislamiento.

---

## 3) Autenticación y autorización
- **Supabase Auth** para usuarios internos (sindicato/delegados/proveedores) y su vínculo a tenant.
- **Modelo de roles** (matriz de permisos) implementado en:
  - Guards en NextJS
  - Políticas **RLS** en Supabase
- **Acceso en GoodBarber por grupos**:
  - “Verificado” (socio con acceso)
  - “Ex-socios” (bloqueo de accesos)
  - Sin grupo (usuario sin padrón/verificación)

---

## 4) Contrato de integración CRM ↔ GoodBarber (punto crítico)

### 4.1 Grupos y control de acceso
- Reglas técnicas para mover usuarios a:
  - **Grupo “Verificado”** tras validación
  - **Grupo “Ex-socios”** al dar de baja
- Definir: responsable (endpoint/función), reintentos, manejo de caída de GoodBarber.

### 4.2 Custom Code + hooks (miniapps / formularios)
- Qué pantallas se implementan como **Custom Code sections**.
- Qué eventos disparan (hooks), qué payload se envía al CRM y qué respuesta mínima vuelve.
- Contrato de “validación” para acciones rápidas en app (formularios/miniapps).

### 4.3 Custom Feeds / Content API
- Especificación de feeds JSON: paginación, caching, seguridad.
- Qué datos del CRM se exponen vía feed (p.ej. convenios, eventos, noticias internas).

### 4.4 Credenciales (APP ID / tokens)
- Gestión por tenant: almacenamiento seguro, rotación, ambientes (dev/stg/prod).
- Permisos mínimos y segregación por aplicación.

---

## 5) Diseño de APIs del CRM
- Definir endpoints (idealmente OpenAPI) para:
  - Importación de padrón
  - Matching/Verificación
  - Alta “Verificado” / Baja “Ex-socio”
  - Validación de convenio (QR/ID/correo)
  - Registro de usos
  - Tickets
  - Contenidos + aprobación
  - Campañas por eventos
- Decidir **Edge Functions vs NextJS route handlers** según latencia, seguridad y mantenimiento.
- Asegurar **idempotencia** y reintentos en operaciones de integración.

---

## 6) Flujos críticos (diagramas de secuencia)
Para cada flujo del MVP, definir pasos y responsables:
- Importación padrón → motor de match → estado del socio.
- Verificación → asignación a grupo “Verificado”.
- Baja → mover a “Ex-socios”.
- Validación de convenio (QR/ID/correo) → respuesta al proveedor → registro del evento.
- Aprobación de contenidos (delegable) → publicación/visibilidad.

---

## 7) Seguridad, privacidad y auditoría
- Riesgos principales: fuga entre tenants, suplantación, abuso de endpoints, scraping.
- Auditoría: evento, actor, tenant, before/after, retención.
- Rate limiting y protección especial para endpoints consumidos por custom code/proveedores.

---

## 8) Operación y observabilidad
- Logging estructurado con `tenant_id`.
- Métricas MVP: verificados, usos, tickets, tiempos de aprobación, fallos de integración.
- Manejo de errores: reintentos, registro de fallos y alertas.

---

## 9) DevOps y calidad
- Ambientes (dev/stg/prod), CI/CD, migraciones y seeds por tenant.
- Testing mínimo:
  - pruebas de RLS
  - contract tests de endpoints
  - smoke tests de flujos críticos

---

## Entregables de esta etapa
- Diagramas C4 + mapa de componentes
- ERD + políticas RLS
- Matriz de roles/permisos
- Contrato de integración GoodBarber (grupos, custom code, feeds, credenciales)
- Catálogo de APIs (OpenAPI)
- Diagramas de secuencia de flujos MVP
- Plan mínimo de observabilidad + calidad

