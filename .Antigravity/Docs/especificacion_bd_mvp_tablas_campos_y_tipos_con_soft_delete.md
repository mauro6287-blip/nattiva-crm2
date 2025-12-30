# Especificación de Base de Datos (Postgres/Supabase) – MVP

> Alcance: multi-inquilino **tenant=app**. Todas las tablas de negocio incluyen **Soft Delete**.

---

## Convenciones globales

### Identificadores
- PK estándar: `id uuid` (default: `gen_random_uuid()`)
- Identidad de usuarios Supabase: `auth.users.id uuid`

### Multi-tenant
- Casi todas las tablas incluyen `tenant_id uuid NOT NULL` (FK a `tenants.id`).
- Regla: **toda consulta debe filtrar por `tenant_id`** (enforced por RLS).

### Auditoría base (en tablas de negocio)
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()` (ideal: trigger)

### Soft Delete (OBLIGATORIO)
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL` (FK a `auth.users.id`)

> Regla operacional: “eliminado” = `deleted_at IS NOT NULL`. No se borra físico en el MVP.

### Recomendación de índices
- Índice compuesto frecuente: `(tenant_id, deleted_at)`
- Índices por campos de búsqueda: email, rut/documento, estado, fechas.

---

## Tipos/Enums sugeridos (Postgres)

### `socio_status`
- `pending` | `verified` | `unmatched` | `ex_member` | `blocked`

### `ticket_status`
- `open` | `in_progress` | `resolved` | `closed`

### `content_status`
- `draft` | `submitted` | `approved` | `rejected` | `published` | `archived`

### `approval_decision`
- `approved` | `rejected`

### `validation_method`
- `qr` | `member_id` | `email` | `manual`

---

# Tablas

## 1) `tenants`
Representa cada “app”/sindicato.
- `id uuid PK`
- `name text NOT NULL`
- `slug text NOT NULL UNIQUE`
- `status text NOT NULL DEFAULT 'active'` (p.ej. active/suspended)
- `timezone text NOT NULL DEFAULT 'America/Santiago'`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- (opcional) `deleted_at`, `deleted_by` (si planeas desactivar tenants sin borrado)

Índices:
- `unique(slug)`

---

## 2) `tenant_integrations`
Credenciales y configuración de integración por tenant (GoodBarber/otros).
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `provider text NOT NULL` (ej: 'goodbarber')
- `app_id text NOT NULL` (APP ID de GoodBarber)
- `api_base_url text NULL`
- `api_key_encrypted text NULL` (si aplica; ideal cifrado)
- `webhook_secret_encrypted text NULL`
- `settings jsonb NOT NULL DEFAULT '{}'::jsonb` (mapeos, flags, endpoints)
- `last_sync_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(tenant_id, provider)`

---

## 3) `roles`
Catálogo de roles internos.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `code text NOT NULL` (ej: 'sindicato_admin', 'delegado', 'proveedor_admin')
- `name text NOT NULL`
- `description text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(tenant_id, code)`

---

## 4) `permissions`
Permisos normalizados (opcional si prefieres permisos por enum/JSON).
- `id uuid PK`
- `code text NOT NULL UNIQUE` (ej: 'SOCIOS_READ', 'CONTENIDO_APPROVE')
- `name text NOT NULL`
- `description text NULL`

---

## 5) `role_permissions`
Relación N:N rol ↔ permiso.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `role_id uuid NOT NULL FK -> roles.id`
- `permission_id uuid NOT NULL FK -> permissions.id`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(tenant_id, role_id, permission_id)`

---

## 6) `user_profiles`
Perfil interno y vínculo a tenant.
- `id uuid PK FK -> auth.users.id`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `role_id uuid NOT NULL FK -> roles.id`
- `email text NOT NULL` (ideal: `citext`)
- `full_name text NULL`
- `phone text NULL`
- `is_active boolean NOT NULL DEFAULT true`
- `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(tenant_id, email)`

---

## 7) `socios`
Registro maestro del socio (puede venir del padrón y/o consolidarse).
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `member_number text NOT NULL` (ID de socio usado operativamente)
- `rut_or_document text NULL` (si aplica; considerar cifrado/mascaramiento)
- `email text NULL`
- `first_name text NULL`
- `last_name text NULL`
- `status socio_status NOT NULL DEFAULT 'pending'`
- `verified_at timestamptz NULL`
- `ex_member_at timestamptz NULL`
- `notes text NULL`
- `source text NOT NULL DEFAULT 'padron'` (padron/manual/import)
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints e índices:
- `unique(tenant_id, member_number)`
- Índices: `(tenant_id, status)`, `(tenant_id, email)`, `(tenant_id, rut_or_document)`

---

## 8) `padron_imports`
Cabecera de una carga/importación del padrón.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `uploaded_by uuid NOT NULL FK -> auth.users.id`
- `filename text NULL`
- `source_type text NOT NULL` (csv/xlsx/api)
- `status text NOT NULL DEFAULT 'processing'` (processing/complete/failed)
- `total_rows integer NOT NULL DEFAULT 0`
- `matched_rows integer NOT NULL DEFAULT 0`
- `unmatched_rows integer NOT NULL DEFAULT 0`
- `error_summary text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, created_at desc)`

---

## 9) `padron_rows`
Detalle por fila (raw) de la importación.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `import_id uuid NOT NULL FK -> padron_imports.id`
- `row_number integer NOT NULL`
- `raw jsonb NOT NULL` (fila original)
- `member_number text NULL`
- `rut_or_document text NULL`
- `email text NULL`
- `match_status text NOT NULL DEFAULT 'pending'` (pending/matched/unmatched)
- `matched_socio_id uuid NULL FK -> socios.id`
- `match_reason text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(import_id, row_number)`

---

## 10) `socio_user_links`
Vínculo entre un usuario (en app/CRM) y el socio (para verificación y accesos).
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `user_id uuid NOT NULL FK -> auth.users.id`
- `socio_id uuid NOT NULL FK -> socios.id`
- `link_status text NOT NULL DEFAULT 'active'` (active/revoked)
- `linked_at timestamptz NOT NULL DEFAULT now()`
- `revoked_at timestamptz NULL`
- `created_by uuid NULL FK -> auth.users.id`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(tenant_id, user_id)` (un usuario se asocia a un socio en ese tenant)

---

## 11) `goodbarber_user_map`
Mapeo para sincronizar identidad con GoodBarber.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `user_id uuid NOT NULL FK -> auth.users.id`
- `gb_user_id text NULL` (si existe identificador en GB)
- `gb_email text NULL`
- `last_group text NULL` (último grupo conocido)
- `last_synced_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(tenant_id, user_id)`

---

## 12) `goodbarber_group_sync_log`
Log de operaciones de cambio de grupo (Verificado/Ex-socios/etc.).
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `user_id uuid NULL FK -> auth.users.id`
- `gb_user_id text NULL`
- `action text NOT NULL` (assign/remove)
- `from_group text NULL`
- `to_group text NULL`
- `status text NOT NULL DEFAULT 'queued'` (queued/success/failed)
- `attempts integer NOT NULL DEFAULT 0`
- `last_error text NULL`
- `requested_by uuid NULL FK -> auth.users.id`
- `requested_at timestamptz NOT NULL DEFAULT now()`
- `processed_at timestamptz NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, status, requested_at)`

---

## 13) `proveedores`
Proveedores asociados a convenios.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `name text NOT NULL`
- `tax_id text NULL` (RUT/ID empresa)
- `contact_name text NULL`
- `contact_email text NULL`
- `contact_phone text NULL`
- `status text NOT NULL DEFAULT 'active'`
- `notes text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, name)`

---

## 14) `convenios`
Convenios/beneficios.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `proveedor_id uuid NOT NULL FK -> proveedores.id`
- `title text NOT NULL`
- `description text NULL`
- `terms text NULL`
- `start_date date NULL`
- `end_date date NULL`
- `is_active boolean NOT NULL DEFAULT true`
- `validation_rules jsonb NOT NULL DEFAULT '{}'::jsonb` (reglas específicas)
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, proveedor_id)`, `(tenant_id, is_active)`

---

## 15) `validation_events`
Registro de validaciones/usos de convenio (trazabilidad para sindicato/proveedor).
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `convenio_id uuid NOT NULL FK -> convenios.id`
- `proveedor_id uuid NOT NULL FK -> proveedores.id`
- `socio_id uuid NULL FK -> socios.id` (puede ser NULL si no se identifica)
- `validated_by_user_id uuid NULL FK -> auth.users.id` (operador/proveedor interno)
- `method validation_method NOT NULL`
- `member_number text NULL` (capturado)
- `email text NULL` (capturado)
- `result text NOT NULL` (approved/denied)
- `reason text NULL`
- `payload jsonb NOT NULL DEFAULT '{}'::jsonb` (datos extra: dispositivo, etc.)
- `created_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, convenio_id, created_at desc)`
- `(tenant_id, socio_id, created_at desc)`

---

## 16) `tickets`
Soporte/solicitudes.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `created_by uuid NOT NULL FK -> auth.users.id`
- `assigned_to uuid NULL FK -> auth.users.id`
- `subject text NOT NULL`
- `status ticket_status NOT NULL DEFAULT 'open'`
- `priority text NOT NULL DEFAULT 'normal'` (low/normal/high)
- `category text NULL`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, status)`, `(tenant_id, created_at desc)`

---

## 17) `ticket_messages`
Mensajes de un ticket.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `ticket_id uuid NOT NULL FK -> tickets.id`
- `author_id uuid NOT NULL FK -> auth.users.id`
- `body text NOT NULL`
- `attachments jsonb NOT NULL DEFAULT '[]'::jsonb` (refs a Storage)
- `created_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, ticket_id, created_at)`

---

## 18) `contents`
Contenido gestionado (noticias, recursos, etc.) y su ciclo de aprobación.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `author_id uuid NOT NULL FK -> auth.users.id`
- `title text NOT NULL`
- `body text NULL`
- `content_type text NOT NULL` (news/resource/page)
- `status content_status NOT NULL DEFAULT 'draft'`
- `tags text[] NOT NULL DEFAULT '{}'`
- `target_groups text[] NOT NULL DEFAULT '{}'` (ej: ['Verificado'])
- `publish_at timestamptz NULL`
- `published_at timestamptz NULL`
- `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, status)`, `(tenant_id, publish_at)`

---

## 19) `content_approvals`
Aprobaciones y decisiones sobre contenidos.
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `content_id uuid NOT NULL FK -> contents.id`
- `reviewer_id uuid NOT NULL FK -> auth.users.id`
- `decision approval_decision NOT NULL`
- `comment text NULL`
- `decided_at timestamptz NOT NULL DEFAULT now()`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Constraints:
- `unique(tenant_id, content_id, reviewer_id)` (si solo 1 decisión por revisor)

---

## 20) `campaigns`
Campañas (por eventos/fechas, comunicación segmentada).
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `name text NOT NULL`
- `description text NULL`
- `status text NOT NULL DEFAULT 'draft'` (draft/active/paused/completed)
- `starts_at timestamptz NULL`
- `ends_at timestamptz NULL`
- `audience jsonb NOT NULL DEFAULT '{}'::jsonb` (segmentación)
- `channels text[] NOT NULL DEFAULT '{}'` (in-app/email/push)
- `created_by uuid NOT NULL FK -> auth.users.id`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

---

## 21) `campaign_events`
Eventos/acciones de campaña (envíos, clics, aperturas, etc.)
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `campaign_id uuid NOT NULL FK -> campaigns.id`
- `event_type text NOT NULL` (sent/open/click/fail)
- `user_id uuid NULL FK -> auth.users.id`
- `payload jsonb NOT NULL DEFAULT '{}'::jsonb`
- `created_at timestamptz NOT NULL DEFAULT now()`
- `deleted_at timestamptz NULL`
- `deleted_by uuid NULL`

Índices:
- `(tenant_id, campaign_id, created_at desc)`

---

## 22) `audit_log`
Bitácora de acciones relevantes (seguridad/trace).
- `id uuid PK`
- `tenant_id uuid NOT NULL FK -> tenants.id`
- `actor_id uuid NULL FK -> auth.users.id`
- `action text NOT NULL` (ej: 'SOCIO_VERIFIED', 'GB_GROUP_ASSIGNED')
- `entity_type text NOT NULL`
- `entity_id uuid NULL`
- `before jsonb NULL`
- `after jsonb NULL`
- `metadata jsonb NOT NULL DEFAULT '{}'::jsonb`
- `created_at timestamptz NOT NULL DEFAULT now()`

> Normalmente **no** se soft-deletea (para trazabilidad). Si lo quieres, agrega `deleted_at/deleted_by`.

Índices:
- `(tenant_id, created_at desc)`, `(tenant_id, action)`

---

# Notas RLS (alto nivel)
- Todas las tablas con `tenant_id`: políticas que permitan acceso solo si el usuario pertenece al tenant.
- Tablas sensibles (`socios`, `padron_rows`, `validation_events`): políticas por rol y por finalidad.
- En consultas estándar, filtrar siempre `deleted_at IS NULL` (views ayudan).

---

# Recomendación práctica para Soft Delete
Crear vistas por tabla de negocio:
- `v_socios` = `SELECT * FROM socios WHERE deleted_at IS NULL`.
- Igual para convenios, proveedores, contenidos, tickets, etc.

Y/o usar una función/trigger para `updated_at` y patrones de eliminación.

