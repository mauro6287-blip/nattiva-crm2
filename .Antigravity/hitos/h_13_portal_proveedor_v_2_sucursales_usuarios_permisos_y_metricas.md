# H13 — Portal Proveedor v2 (sucursales, usuarios, permisos y métricas)

## Propósito
Habilitar operación real en terreno con control y trazabilidad: **sucursales**, **usuarios internos**, permisos y métricas propias.

## Alcance
- Gestión de sucursales por proveedor.
- Usuarios del proveedor con roles (admin proveedor / operador).
- Trazabilidad de validaciones por sucursal y por usuario.
- Workflow mejorado de contenidos (si el proveedor carga contenido/ofertas).

## Entregables
### 1) Sucursales
- CRUD de sucursales:
  - nombre, dirección, contacto
  - (opcional) geolocalización
  - estado: activa/inactiva
- Relación sucursal ↔ validaciones (para reporting).

### 2) Usuarios del proveedor + permisos
- Gestión de usuarios:
  - alta/baja
  - invitación / reset (según auth)
  - asignación de rol
- Roles sugeridos:
  - **Admin proveedor:** gestiona sucursales, usuarios, contenidos, ve métricas globales.
  - **Operador:** realiza validaciones/gestiona lo operativo de su sucursal.

### 3) Métricas y vistas operativas
- Dashboard del proveedor:
  - validaciones OK/Fail
  - volumen por sucursal
  - top días/horas
  - causas de fallo (si se registra)
- Listado de validaciones con filtros (fecha, sucursal, estado, operador).

### 4) Workflow de contenidos (si aplica)
- Estados: borrador → enviado → aprobado → publicado → expirado.
- Validaciones por campos obligatorios y vigencia.
- Historial de cambios.

### 5) Auditoría
- Registrar actor (usuario proveedor), sucursal, tenant, timestamp en acciones críticas.

## Criterios de aceptación
- Proveedor no comparte credenciales: cada operador tiene cuenta.
- Se puede auditar quién validó qué y desde qué sucursal.
- Los proveedores solo ven datos de su proveedor y de su tenant (aislamiento total).

## Tareas sugeridas (desglose)
- Modelo de datos: sucursales, usuarios proveedor, roles y permisos.
- Políticas RLS por proveedor y tenant.
- UI portal: gestión de sucursales y usuarios.
- UI: dashboards + filtros.
- QA: pruebas por rol y cross-tenant/cross-proveedor.

## Roles
- **Backend (Owner):** permisos, RLS, modelos y endpoints.
- **Frontend (Owner portal):** UX de gestión + dashboards.
- **QA:** permisos, regresión y seguridad.
- **Operación/Sindicato:** reglas de visibilidad y aprobaciones (si aplica).

## Riesgos / notas
- Si se agrega geo, definir límites de precisión y privacidad.
- Métricas requieren consistencia de eventos (alinear con H11).

## Definition of Done
- Sucursales + usuarios + roles + métricas básicas.
- Workflow de contenidos (si aplica) con auditoría.
- Pruebas de aislamiento (proveedor/tenant).

