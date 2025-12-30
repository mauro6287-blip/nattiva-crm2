# Resumen ejecutivo (MVP)

## 1. Visión
Construir un **CRM SaaS multi‑inquilino (tenant = App)** integrado a aplicaciones creadas en **GoodBarber**, con el objetivo de **administrar de manera eficiente a los usuarios (socios) y la operación del sindicato**, extendiendo lo que el backoffice de GoodBarber no cubre.

El CRM será el **centro de gobierno, operación y métricas** para:
- Verificar socios vs padrón oficial del sindicato.
- Controlar accesos a funcionalidades de la App mediante grupos.
- Gestionar convenios/proveedores con publicación moderada.
- Registrar y medir el uso real de convenios mediante validación (QR + contingencia).
- Operar solicitudes mediante ticketing.
- Ejecutar campañas gatilladas por eventos.

> En este MVP el foco es cerrar el circuito: **padrón → verificación → acceso → uso de convenios → métricas → operación**.

---

## 2. Modelo de multi‑inquilino
- **Tenant = App**.
- Cada App se integra al CRM mediante **App ID + API Key** (GoodBarber).
- Todo lo que ocurre (padrón, verificación, proveedores, contenidos, tickets, campañas, métricas) queda **aislado por App/tenant**.

---

## 3. Actores (usuarios del sistema)
1) **SaaS Owner / Superadmin** (plataforma)
- Control global y soporte de tenants.

2) **Admin Sindicato**
- Importa padrón, verifica socios, configura operación, aprueba o delega aprobaciones.

3) **Moderador/Operador Sindicato** (delegado)
- Aprueba contenidos si se delega; gestiona tickets; ejecuta campañas.

4) **Proveedor**
- Publica convenios/eventos (bajo aprobación) y valida socios/cargas en el punto de uso.

5) **Miembro (socio)**
- Accede a contenidos/beneficios (si está verificado) y crea tickets.

6) **Carga (dependiente)**
- Existe en el CRM como registro asociado al socio. En el uso de convenios se identifica como carga ligada al ID del socio.

---

## 4. Reglas críticas del MVP

### 4.1 Verificación y control de acceso (GoodBarber)
- Existe un grupo en GoodBarber llamado **“Verificado”**.
- Cuando un usuario de la App se confirma contra el padrón oficial, el CRM lo mueve/activa como **Verificado**.
- Si no está verificado, el usuario queda **sin grupo** y **no accede** a secciones/funcionalidades exclusivas de socios.
- Para ex‑socios, el sindicato los marca como **Ex‑socio** y el CRM los mueve a un grupo GoodBarber **“Ex‑socios”** para quitar accesos.

### 4.2 Identidad y match (padrón ↔ usuarios App)
- El sindicato importa el **universo oficial** de socios y cargas al CRM.
- Se realiza **match** con los usuarios que se registran en la App:
  1) Prioridad 1: **correo login** (GoodBarber funciona mejor con este dato).
  2) Prioridad 2: **correo corporativo** (dato oficial del sindicato).
  3) Si hay ambigüedad/duplicados: **cola de revisión manual**.
- Una vez confirmado el match, el CRM asigna y guarda el **GoodBarber User ID** como **identificador único** para todos los registros futuros.

### 4.3 Uso real de convenios (punto de verdad)
- El “uso del convenio” se registra por **validación**:
  - Ideal: **escaneo de QR** (credencial).
  - Contingencia: el socio entrega **ID de socio o correo de registro**.
- El proveedor valida y el CRM responde si el socio/carga está **registrado y vigente**.
- Cada validación genera un **evento trazable** para métricas.

---

## 5. Catálogo funcional del MVP

### 5.1 Padrón y adopción de App
- Importación de padrón (socios + cargas).
- Estados de adopción:
  - En padrón sin App
  - En App sin padrón (según política operativa)
  - Match confirmado
  - Ambiguo / requiere revisión
- Dashboard de **adopción**: verificados vs padrón total.

### 5.2 Proveedores y contenidos (moderados)
- Portal proveedor para crear contenidos:
  - **Convenios**
  - **Eventos**
- Workflow de aprobación (delegable):
  - borrador → enviado → aprobado/rechazado → publicado → expirado
- Aprobación obligatoria para:
  - contenidos de **proveedores**
  - contenidos de **socios** (si aplica en fases posteriores)

### 5.3 Credencial y validación
- Credencial virtual asociada al usuario (GoodBarber User ID) con:
  - Logo sindicato
  - Foto
  - Nombre
  - Estado socio
  - Email registrado
  - ID User
  - QR con ID
- Validación por proveedor para registrar uso de convenio.

### 5.4 Ticketing miembro ↔ sindicato
- Creación de tickets desde la App.
- Asignación a operadores.
- Estados, historial, notificaciones.
- Auditoría de cambios.

### 5.5 Encuestas y formularios
- **Solo el sindicato** crea:
  - Encuestas
  - Formularios
- Resultados alimentan métricas y segmentación.

### 5.6 Campañas por eventos
- Campañas disparadas por eventos (ejemplos):
  - Tras validación de convenio → push/email de seguimiento
  - Tras creación/cierre de ticket → notificación
  - Inactividad → reactivación (si se define)

---

## 6. Métricas núcleo (MVP)
- **Adopción App** (padrón vs verificados)
- **Tickets** abiertos/cerrados
- **Uso de convenios** (validaciones)
- **Participación** (acciones clave)
- **Encuestas** (tasa de respuesta / resultados)
- **Engagement de contenidos**

---

## 7. Auditoría y retención
- Auditoría obligatoria para acciones críticas:
  - verificación/movimiento de grupos
  - aprobaciones/rechazos de contenido
  - validaciones de convenios
  - cambios de permisos
  - gestión de tickets
- **Retención de datos: 36 meses**.

---

## 8. Flujo operativo end‑to‑end (MVP)
1) Admin integra App (App ID + API Key).
2) Sindicato importa padrón (socios + cargas).
3) Usuarios se registran en la App.
4) CRM hace match (correo login → corporativo → manual).
5) Confirmado: usuario pasa a grupo **Verificado** (acceso total).
6) Proveedor publica convenio/evento → sindicato aprueba → se publica en la App.
7) Socio usa convenio → proveedor valida por QR (o ID/correo) → se registra evento.
8) Miembro crea ticket → sindicato opera y cierra → métricas y auditoría.
9) Campañas se disparan por eventos (uso convenio, tickets, etc.).

---

## 9. Backlog del MVP (épicas)
1) Tenant por App (integración GoodBarber)
2) Importación padrón + motor de match + cola de revisión
3) Gestión de verificación y grupos (Verificado / Ex‑socios)
4) Portal proveedor + contenidos (convenios/eventos) + aprobación delegable
5) Credencial + QR + validación + registro de uso
6) Ticketing + asignación + notificaciones
7) Campañas por eventos
8) Dashboard de métricas núcleo
9) Auditoría + retención 36 meses

---

## 10. Límites del MVP (para mantenerlo óptimo)
- IA/RAG: fuera del MVP; se planifica para fase posterior con foco en **recomendaciones**.
- Grupos GoodBarber ↔ CRM: en MVP el CRM **solo recomienda** (no crea/actualiza automáticamente).
- Encuestas y formularios: **solo sindicato**.
- Validación en contingencia: por **ID de socio o correo** (registrando quién valida y el resultado).

