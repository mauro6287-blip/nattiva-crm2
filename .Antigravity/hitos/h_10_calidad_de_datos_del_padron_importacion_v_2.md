# H10 — Calidad de datos del padrón (importación v2)

## Propósito
Reducir errores y fricción en el circuito padrón → verificación: importar, validar y reconciliar con control y trazabilidad.

## Alcance
- Pipeline de importación con **staging** (sin impactar producción hasta confirmar).
- Validaciones avanzadas, deduplicación asistida y reporte de cambios (diff).
- Bitácora completa por importación (auditoría + resultados).

## Entregables
### 1) Staging de importación
- Área/tablas de staging por `tenant_id`.
- Estados del proceso: cargado → validado → listo para aplicar → aplicado → revertido (si aplica).

### 2) Validaciones
- Campos requeridos y formatos (ID socio, correo, fechas, etc.).
- Reglas de integridad (IDs únicos, combinaciones válidas).
- Detección de duplicados y conflictos.
- Reporte de errores descargable (CSV) + resumen por tipo.

### 3) Deduplicación asistida
- Sugerencias de match (por reglas: ID exacto, email, similitud de nombre).
- UI para resolver conflictos: fusionar / mantener / descartar.
- Registro de decisión (quién decidió y por qué).

### 4) Diff vs padrón anterior
- Reporte de:
  - **Altas**
  - **Bajas**
  - **Cambios** (campos modificados)
- Vista previa antes de aplicar.

### 5) Bitácora y auditoría
- Historial: quién subió, cuándo, fuente, tamaño, resumen.
- Registro por fila (opcional por volumen): aplicada / rechazada / conflictiva.

## Criterios de aceptación
- Importar no “ensucia” producción: todo pasa por staging y confirmación.
- Se puede explicar qué cambió con cada importación.
- Errores se detectan antes de aplicar, con export claro para corrección.

## Tareas sugeridas (desglose)
- Definir formato estándar de archivo (CSV/XLSX) y mapeo de columnas.
- Implementar parser + validaciones (sync/async según tamaño).
- UI de revisión: resumen, errores, conflictos, diff.
- Acción “Aplicar cambios” con transacción/seguridad.
- (Opcional) Reversión controlada (si el negocio lo requiere).
- Índices y performance para volumen real.

## Roles
- **Backend (Owner):** pipeline, reglas, transacciones.
- **Frontend:** UI staging/diff/conflictos.
- **Operación/Sindicato:** define reglas y excepciones.
- **QA:** casos con datos sucios, duplicados, formatos mixtos.

## Riesgos / notas
- Volumen grande puede requerir jobs asíncronos y paginación.
- Reglas de deduplicación demasiado agresivas pueden fusionar mal: incluir confirmación humana.

## Definition of Done
- Staging + validaciones + diff + bitácora.
- Flujo completo probado con datos reales y escenarios de error.

