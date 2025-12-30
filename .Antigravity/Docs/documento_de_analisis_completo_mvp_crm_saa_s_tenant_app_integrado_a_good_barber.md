# Documento de análisis completo (MVP)

## 0. Propósito del documento
Este documento define el **alcance funcional y de usuarios** del **MVP** de un CRM SaaS **multi-inquilino** (tenant = **App**) integrado a **GoodBarber**, para administración de socios, operación sindical y gestión de convenios/proveedores.

> Nota: este documento **no** define tecnologías, arquitectura ni infraestructura. Se centra en requerimientos, reglas de negocio, flujos, roles, datos y criterios de aceptación.

---

## 1. Contexto y problema a resolver
### 1.1 Contexto
Los sindicatos ya cuentan con un **universo de sindicalizados (padrón)** y necesitan:
- Aumentar la **adopción** de la App.
- Controlar acceso a funcionalidades exclusivas de socios.
- Gestionar convenios y proveedores con trazabilidad de uso real.
- Atender solicitudes (tickets) con auditoría.
- Automatizar campañas por eventos.

GoodBarber aporta funcionalidades nativas (grupos, notificaciones, publicación de contenidos), pero el **backoffice** no cubre la operación completa (padrón, match, auditoría, portal proveedores, ticketing, métricas unificadas).

### 1.2 Problemas actuales
- No existe un sistema único que cruce **padrón oficial ↔ usuarios reales de la App**.
- El sindicato no controla con precisión **quién es socio vigente** dentro de la App.
- El uso real de convenios es difícil de medir.
- La operación (soporte, solicitudes, tareas) queda dispersa.

### 1.3 Objetivo del MVP
Crear un MVP que cierre el circuito operativo:
1) **Integración de App (tenant)**
2) **Importación de padrón**
3) **Match + verificación + control de acceso**
4) **Gestión de proveedores y convenios con aprobación**
5) **Registro de uso real por validación (QR + contingencia)**
6) **Ticketing**
7) **Campañas gatilladas por eventos**
8) **Métricas núcleo + auditoría + retención 36 meses**

---

## 2. Alcance (In/Out)
### 2.1 En alcance (MVP)
- Multi-tenant con tenant = App.
- Integración GoodBarber vía App ID + API Key.
- Padrón (socios + cargas) importable.
- Motor de match (correo login → correo corporativo → revisión manual).
- Control de acceso en App con grupos GoodBarber: **Verificado** y **Ex-socios**.
- Portal proveedor para convenios y eventos (bajo aprobación).
- Validación de socio/carga para uso de convenios:
  - Principal: QR de credencial.
  - Contingencia: ID socio o correo de registro.
- Ticketing miembro ↔ sindicato.
- Encuestas y formularios creados solo por sindicato.
- Campañas disparadas por eventos.
- Dashboard con métricas núcleo.
- Auditoría + retención 36 meses.

### 2.2 Fuera de alcance (para fases posteriores)
- IA/RAG (solo se documenta como futuro; no se implementa en MVP).
- CRM escribiendo/actualizando automáticamente grupos GoodBarber (en MVP solo recomienda).
- Publicaciones UGC (venta/servicios) de socios (se deja como extensión futura; si aparece, pasa por aprobación).
- Geofencing (pendiente de definición).

---

## 3. Modelo multi-inquilino
### 3.1 Definición de tenant
- **Tenant = App**.
- Cada App tiene configuración, padrón, proveedores, contenido, tickets, campañas y métricas independientes.

### 3.2 Roles globales vs por tenant
- **Superadmin (SaaS Owner):** acceso global a todos los tenants para soporte y control.
- Roles por tenant (sindicato y proveedores): Admin, Backup Admin, Moderador, Operador, Proveedor.

---

## 4. Actores, roles y permisos
### 4.1 Actores
1) Superadmin (plataforma)
2) Admin Sindicato
3) Backup Admin Sindicato
4) Moderador (delegado)
5) Operador
6) Proveedor
7) Miembro (usuario App)
8) Carga (dependiente, representado en CRM)

### 4.2 Objetivos por rol
- **Admin/Backup:** control de padrón, verificación, configuración, aprobaciones, métricas.
- **Moderador:** aprobar contenidos si se delega; operar tickets; campañas.
- **Operador:** operar tickets y tareas asignadas.
- **Proveedor:** crear contenidos propios; validar uso; ver métricas propias.
- **Miembro:** consumir recursos; credencial; crear tickets; responder encuestas.

### 4.3 Matriz de permisos (MVP)
| Módulo | Admin/Backup | Moderador | Operador | Proveedor | Miembro |
|---|---:|---:|---:|---:|---:|
| Configuración tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| Importar padrón | ✅ | ⚠️ (si delega) | ❌ | ❌ | ❌ |
| Verificar socio (mover a Verificado) | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Marcar Ex-socio (mover a Ex-socios) | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Roles y responsabilidades internas | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear convenios/eventos | ✅ | ✅ | ❌ | ✅ | ❌ |
| Aprobar contenidos (proveedor/socios) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Validar (QR / ID / correo) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ticketing (operar/asignar) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ticketing (crear) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Encuestas/Formularios (crear) | ✅ | ✅ | ⚠️ (si delega) | ❌ | ❌ |
| Encuestas/Formularios (responder) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Campañas por eventos (configurar/ejecutar) | ✅ | ✅ | ⚠️ | ❌ | recibe |
| Métricas | ✅ | ✅ | ⚠️ | ✅ (propias) | ❌ |
| Auditoría (lectura) | ✅ | ✅ | ⚠️ | ⚠️ (solo propias) | ❌ |

---

## 5. Reglas de negocio (MVP)

## 5.1 Identidad y match (padrón ↔ usuario App)
### 5.1.1 Fuente de verdad
- El **padrón** es la referencia oficial de membresía.
- El **GoodBarber User ID** es el identificador único para trazabilidad una vez existe match.

### 5.1.2 Regla de match
1) Match por **correo login** (preferente).
2) Si no existe, match por **correo corporativo**.
3) Si hay múltiples candidatos (duplicados) → se envía a **cola de revisión manual**.
4) Confirmado el match:
   - Se guarda el **GoodBarber User ID** en el registro del socio.
   - Se actualiza estado del socio como “Verificado”.

### 5.1.3 Manejo de usuarios “sin padrón”
- Si el usuario no matchea, queda **sin grupo** en GoodBarber.
- En consecuencia, no accede a secciones exclusivas de socios.

### 5.1.4 Cargas
- Las cargas se registran en el CRM asociadas a un socio.
- En el uso de convenios, la carga se identifica y entrega el **ID del socio** al proveedor para registrar el uso como carga.

---

## 5.2 Control de acceso por grupos (GoodBarber)
- Grupo **“Verificado”**: habilita acceso a funcionalidades/recursos de socio.
- Grupo **“Ex-socios”**: quita accesos.
- El sindicato debe marcar a un socio como **Ex-socio** en el CRM para que el usuario sea movido al grupo correspondiente.

---

## 5.3 Contenidos y aprobación
### 5.3.1 Tipos de contenido (MVP)
- **Convenios** (proveedor)
- **Eventos** (proveedor)
- **Encuestas** (sindicato)
- **Formularios** (sindicato)

### 5.3.2 Reglas de aprobación
- Aprobación obligatoria para contenidos de:
  - Proveedores
  - Socios (si aparece UGC, se rige por aprobación)
- La aprobación es **delegable**: Admin/Backup puede habilitar Moderadores.

### 5.3.3 Estados del contenido
- borrador → enviado → aprobado/rechazado → publicado → expirado

---

## 5.4 Uso de convenios y validación
### 5.4.1 Punto de verdad
- **Uso real = validación** (evento registrado).

### 5.4.2 Métodos de validación
- Principal: **QR** (credencial).
- Contingencia: **ID de socio o correo de registro**.

### 5.4.3 Respuesta mínima al proveedor
- Indicar si el socio/carga está:
  - registrado / no registrado
  - vigente / no vigente
  - tipo: socio / carga

### 5.4.4 Registro del evento de uso
- Todo uso debe registrar:
  - fecha/hora
  - convenio
  - proveedor/sucursal
  - GoodBarber User ID del socio
  - carga (si aplica)
  - método (QR/ID/correo)
  - resultado (válido/no válido)
  - usuario proveedor que validó

---

## 5.5 Ticketing
- Miembro crea ticket desde App.
- Sindicato gestiona: asignación, estados, comunicación y cierre.
- Historial del ticket queda asociado al socio (por GoodBarber User ID tras match).

---

## 5.6 Campañas por eventos
- Campañas se disparan por eventos (no solo manual).
- Ejemplos de gatillos:
  - validación de convenio
  - creación/cierre de ticket
  - participación en encuesta
  - (futuro) inactividad

---

## 5.7 Auditoría y retención
- Auditoría obligatoria para acciones críticas:
  - verificación y cambios de grupos
  - aprobaciones/rechazos
  - validaciones de convenios
  - cambios de permisos
  - operaciones sobre tickets
- Retención: **36 meses**.

---

## 6. Requerimientos funcionales (FR)

### FR-01 Gestión de Tenants (App)
- Crear/editar tenant con App ID y API Key.
- Habilitar/deshabilitar tenant.

### FR-02 Importación de padrón
- Importar socios y cargas.
- Validaciones de formato (mínimos: nombre, correo corporativo; ideal: correo login si existe).
- Reporte de errores de importación.

### FR-03 Motor de match
- Ejecutar match automático por correo login y corporativo.
- Generar cola de ambiguos.
- Permitir confirmación manual.
- Al confirmar, asociar GoodBarber User ID.

### FR-04 Control de verificación y grupos
- Marcar socio como Verificado.
- Marcar socio como Ex-socio.
- Mantener consistencia del estado.

### FR-05 Portal proveedor
- Crear/editar contenido (convenios/eventos).
- Enviar a aprobación.
- Ver estado de publicación.

### FR-06 Aprobación de contenidos (delegable)
- Cola de aprobación con filtros.
- Aprobar/rechazar con motivo.
- Registro auditado.

### FR-07 Credencial y QR
- Generar credencial con datos definidos.
- QR con identificador.

### FR-08 Validación de uso de convenios
- Validación por QR.
- Validación por contingencia (ID socio o correo).
- Respuesta mínima (vigente/no vigente).
- Registro de evento.

### FR-09 Ticketing
- Creación desde App.
- Asignación a operador.
- Estados, comentarios, adjuntos.
- Notificaciones.

### FR-10 Encuestas y formularios
- Creación solo por sindicato.
- Distribución a Verificados o segmentos.
- Recopilación de resultados.

### FR-11 Campañas por eventos
- Definir regla: evento → acción (push/email).
- Reporte de performance.

### FR-12 Métricas y dashboard
- Dashboard con métricas núcleo.
- Filtros por fechas.

### FR-13 Auditoría
- Registro de acciones críticas.
- Búsqueda y filtros.

### FR-14 Retención
- Política de retención 36 meses.

---

## 7. Requerimientos no funcionales (NFR)
- Seguridad y resguardo de datos sensibles (enfoque preventivo).
- Trazabilidad/auditoría robusta.
- Separación estricta por tenant.
- Disponibilidad suficiente para operación de validación de convenios.
- Cumplimiento de retención 36 meses.

---

## 8. Entidades (modelo conceptual)
- Tenant/App
- Usuario interno (sindicato)
- Proveedor + usuario proveedor
- Socio (padrón)
- Carga
- Usuario App (GoodBarber)
- Match
- Grupo (Verificado / Ex-socios / otros)
- Convenio
- Evento
- Encuesta
- Formulario
- Validación/Uso convenio (evento)
- Ticket
- Campaña
- Métrica (agregaciones)
- Auditoría

---

## 9. Flujos (user journeys)

### 9.1 Integración del tenant
1) Superadmin crea tenant.
2) Admin sindicato configura App ID + API Key.
3) CRM queda listo para sincronizar usuarios/grupos y operar.

### 9.2 Verificación de socios
1) Admin importa padrón.
2) Usuarios se registran en App.
3) CRM corre match.
4) Confirmados pasan a grupo Verificado.
5) No confirmados quedan sin grupo.

### 9.3 Ex-socio
1) Sindicato marca Ex-socio.
2) Usuario pasa a grupo Ex-socios (sin acceso).
3) Se conserva historial 36 meses.

### 9.4 Convenio: publicación + uso
1) Proveedor crea convenio y lo envía.
2) Moderador/Admin aprueba.
3) Convenio se publica en App.
4) En punto de uso, proveedor valida por QR o contingencia.
5) Se registra evento de uso y se actualizan métricas.

### 9.5 Ticketing
1) Miembro crea ticket.
2) Operador responde/gestiona.
3) Se cierra ticket y se registra auditoría.

### 9.6 Campañas por eventos
1) Se configura regla (evento → acción).
2) Se dispara push/email al ocurrir evento.
3) Se registran métricas de campaña.

---

## 10. Métricas (MVP)
- Adopción App: padrón vs verificados.
- Tickets: abiertos/cerrados, tiempos (si aplica).
- Convenios: validaciones por convenio/proveedor.
- Participación: acciones clave.
- Encuestas: tasa respuesta y resultados.
- Engagement contenidos.

---

## 11. Backlog (épicas e historias base)

### Épica 1: Multi-tenant y configuración
- Crear tenant y credenciales de integración.
- Roles por tenant.

### Épica 2: Padrón + Match
- Importación padrón.
- Match automático y cola de ambiguos.
- Confirmación manual.

### Épica 3: Verificación y grupos
- Gestión Verificado/Ex-socio.

### Épica 4: Proveedores + contenidos
- Portal proveedor.
- Workflow aprobación.

### Épica 5: Credencial + validación
- Generación credencial.
- Validación QR y contingencia.
- Registro de eventos.

### Épica 6: Ticketing
- Creación, asignación, estados, notificaciones.

### Épica 7: Campañas por eventos
- Motor simple de reglas.

### Épica 8: Dashboard
- Métricas núcleo.

### Épica 9: Auditoría + retención
- Auditoría de acciones críticas.
- Retención 36 meses.

---

## 12. Criterios de aceptación (muestras)

### CA-01 Match y verificación
- Dado un usuario App con correo login que existe en padrón, cuando corre el match, entonces el socio queda vinculado a un GoodBarber User ID y pasa a grupo Verificado.

### CA-02 Usuario sin padrón
- Dado un usuario App sin match, entonces no pertenece al grupo Verificado y no accede a secciones exclusivas de socios.

### CA-03 Ex-socio
- Dado un socio marcado como Ex-socio, entonces su usuario queda en grupo Ex-socios y pierde accesos.

### CA-04 Publicación proveedor con aprobación
- Dado un convenio creado por proveedor, entonces no se publica hasta que un moderador/admin lo apruebe.

### CA-05 Uso convenio por QR
- Dado un QR válido, cuando el proveedor valida, entonces el sistema responde vigente/no vigente y registra el evento con método QR.

### CA-06 Uso convenio por contingencia
- Dado que no se puede escanear QR, cuando se valida por ID socio o correo, entonces se registra el evento con método contingencia y quién lo validó.

### CA-07 Ticketing
- Dado un ticket creado por miembro, entonces queda registrado, asignable a un operador y con historial auditado.

### CA-08 Campañas por evento
- Dado un evento configurado como gatillo, cuando ocurre, entonces se ejecuta la acción push/email y se registra su resultado.

---

## 13. Riesgos y controles (nivel análisis)
- Riesgo de fraude en contingencia (ID/correo): mitigación con auditoría, registro de validador, límites y alertas.
- Datos sensibles: principio de mínima exposición, especialmente hacia proveedores.
- Calidad del padrón (correos inconsistentes): mitigación con cola de revisión y reportes.

---

## 14. Fases posteriores (referencia)
- IA/RAG con recomendaciones (deserción, segmentación sugerida, acciones recomendadas).
- Biblioteca documental y análisis avanzado.
- UGC de socios con moderación.
- Geofencing (si se confirma caso de uso).

