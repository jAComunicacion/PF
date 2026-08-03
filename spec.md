# Especificación de la app Personal Count

> **Revisión (2026-08-03):** corrección de alcance vía `/spec`, luego reducción
> de complejidad vía `/plan-eng-review`. Ver "Historial de revisión" al final.

## Objetivo

Automatizar la carga de movimientos financieros: ingesta **automática** desde
Mercado Pago y el banco del usuario (vía parseo de emails de notificación),
con categorización asistida obligatoria, sobre el dashboard existente (saldo,
salud financiera, metas mensuales).

El problema real que resuelve: la carga manual (experiencia previa con
Microsoft Money) es insostenible — datos olvidados (tickets, gastos por
plataforma) rompen la precisión de cualquier proyección financiera.

**Visión a futuro (no en este Epic):** plataforma multi-usuario para que
cualquier profesional se loguee y tenga su propio dashboard. Se pospone
deliberadamente — ver "Por qué se pospone el multi-usuario" más abajo.

## Estado actual verificado (previo a esta revisión)

| Área | Estado hoy | Archivo |
|---|---|---|
| Persistencia | IndexedDB local (Dexie), sin server | `assets/js/data/db.js` |
| Auth | Mock, un solo usuario fijo (`local-user-v1`) | `assets/js/setup/setupAuth.js` |
| Categorías | Tabla única sin `userId`, global a la instalación | `assets/js/data/categoryService.js` |
| Alta de transacción | Formulario → validación → `db.transactions.add()` directo | `assets/js/data/addTransaction.js`, `assets/js/data/transactionPayload.js` |
| Frontend | Vanilla JS, `<script>` tags sueltos, sin bundler ni framework | `index.html`, `assets/js/**` |
| Red | Ninguna llamada externa en todo el código | — |

Los datos de prueba actuales (`personal_count_backup_2026-01-21.json`) se
descartan — la base nueva arranca en cero.

## Por qué se pospone el multi-usuario

La primera versión de este spec incluía auth multi-usuario (magic link),
Row-Level Security en Postgres, y mapeo de direcciones de email a usuarios
desde el arranque. En la revisión técnica (`/plan-eng-review`) eso resultó
ser la fuente de casi toda la complejidad del Epic — sin que nada de eso
aportara al objetivo real: **dejar de cargar movimientos a mano**.

Construir auth + aislamiento multi-usuario + mapeo de direcciones **antes**
de haber probado que el parser de Mercado Pago funciona con un email real es
cargar el riesgo al revés (si el formato del email no es el esperado, se
construyó toda esa infraestructura para nada).

**Decisión:** este Epic entrega una herramienta de automatización personal
(un solo usuario: el owner) primero. El backend, el pipeline de email, el
parser, la categorización obligatoria y el dedupe quedan exactamente igual
que en la versión multi-usuario — son el valor real y no cambian. Lo que se
sacó de esta etapa es: auth multi-usuario, RLS, y administración de otros
profesionales. Esa capa se agrega en una fase final, sobre una base ya
probada en producción.

## Requisitos no funcionales

- ~~Debe funcionar sin backend~~ → **Requiere backend real**: Vercel Functions
  (serverless) + Postgres en Neon. Se descarta Firebase (resultados no
  satisfactorios en proyectos previos del usuario) y se descarta migrar el
  frontend a Next.js (peso/complejidad innecesaria) — el frontend vanilla
  actual se mantiene, solo se le suma una API vía Vercel Functions.
- Debe ser mantenible y modular.
- Debe evitar inyección de HTML en la UI.
- Debe incluir pruebas para la lógica de normalización de transacciones y
  para los parsers de ingesta (nuevo).
- Sin dependencias pagas de terceros para la ingesta (se descartan
  agregadores tipo Belvo por costo; Mailgun free tier cubre el volumen bajo
  de este proyecto).

## Acceso (v1, un solo usuario)

Sin auth multi-usuario en esta etapa. La app sigue siendo de un solo dueño,
pero queda expuesta en un dominio público (Vercel) — necesita alguna
protección mínima para no quedar abierta a cualquiera.

**Recomendación por defecto (a confirmar en implementación, no bloqueante):**
protección simple por contraseña única (variable de entorno + cookie de
sesión), sin tabla de usuarios ni flujo de recuperación. Reemplazable
directamente por el auth multi-usuario real cuando llegue esa fase.

## Categorías

Modelo híbrido (preparado para multi-usuario a futuro, aunque v1 tiene un
solo dueño):
- **Set común** de categorías más usuales.
- **Categorías propias**, creadas vía botón "crear categoría/subcategoría".
- Ambos conjuntos se muestran unificados en el mismo menú desplegable.
- **Creación sin condición de carrera:** constraint `UNIQUE(name, type,
  parent_id)` en Postgres + `INSERT ... ON CONFLICT DO NOTHING` — evita
  duplicados si dos requests llegan casi al mismo tiempo (ej. el parser de
  email corriendo mientras se crea una categoría a mano). El patrón actual
  de `categoryService.js` ("buscar si existe → insertar") es seguro en
  IndexedDB de un solo browser pero no en un backend con requests
  concurrentes — se reemplaza, no se reusa tal cual.

## Ingesta automática

### Recepción de email

- **Canal:** reenvío de emails de notificación (Mercado Pago, banco) a una
  única dirección de ingesta (`ingest@tudominio.com`). El usuario configura
  una regla de reenvío una sola vez en su propio cliente de correo.
- **Recepción técnica:** Vercel Functions no reciben SMTP directo. Se usa
  **Mailgun Inbound Routes** (free tier cubre el volumen de este proyecto)
  para recibir el email y reenviarlo como webhook (POST, ya parseado) a la
  Vercel Function correspondiente.
- **Verificación de firma obligatoria:** cada webhook de Mailgun se valida
  contra su firma HMAC antes de procesar nada. Sin esto, cualquiera que
  descubra la URL del webhook podría inyectar movimientos falsos.
- **Se descarta explícitamente:** OAuth a Gmail (requiere verificación de
  Google para scopes sensibles), agregadores pagos (Belvo), screen scraping
  con credenciales bancarias (riesgo legal/seguridad).
- **Fallback OCR:** sacado de este Epic — ver "Fuera de este Epic" más abajo.

### Fuentes (orden de implementación)

1. **Mercado Pago** — obligatorio, primera fuente a construir.
2. **Banco Hipotecario** — primer banco soportado (banco personal del
   usuario). Otros bancos (Galicia, Nación, BBVA, etc.) quedan en el backlog,
   se suman de a uno según demanda — cada uno requiere su propio parser
   porque el formato de email difiere por entidad.

**Antes de construir el pipeline completo:** validar con muestras reales de
emails de Mercado Pago y Banco Hipotecario que el formato es parseable de
forma confiable. Es un spike de horas, no de días, y evita construir sobre
una asunción de formato que puede estar equivocada.

### Validación server-side

`transactionPayload.js` ya exporta vía `module.exports` (líneas 38-40) — ya
es reusable en Node/Vercel Functions sin cambios. Los tres entry points
(formulario manual, parser Mercado Pago, parser banco) llaman a la **misma**
función de validación del lado del servidor antes de escribir a Postgres. El
cliente puede seguir validando para feedback inmediato, pero el servidor es
la única fuente de verdad — hoy no existe ninguna validación server-side
porque no existe servidor.

### Categorización obligatoria

Todo movimiento que entra por ingesta automática llega en estado "requiere
categoría". La UI **obliga** a resolverlo en el mismo lugar donde aparece
(edición inline) — no queda en una bandeja separada ni se cuenta como
resuelto hasta que se le asigna categoría. Motivo: las transferencias solo
traen el nombre del destinatario como referencia, y ese dato se pierde si no
se resuelve en el momento.

### Deduplicación

Un mismo movimiento real puede llegar notificado dos veces (ej. transferencia
banco → Mercado Pago genera aviso de ambos lados).

**Regla:** se considera el mismo movimiento cuando coinciden **dos señales**
entre fuentes distintas (banco ↔ MP):
1. Mismo monto + misma fecha calendario, normalizada a horario argentino
   (`America/Argentina/Buenos_Aires`) — necesario porque Vercel Functions
   corren en UTC y un movimiento a las 23:50 hora local cae en el día UTC
   siguiente si no se convierte antes de comparar.
2. Coincidencia (aunque sea parcial) entre el concepto/nombre del
   destinatario de ambas notificaciones.

Si **solo** coincide la señal 1 (monto+día) pero no la 2, el movimiento
**no se fusiona automáticamente** — queda marcado como "posible duplicado"
para confirmar con un clic. Motivo: monto+día solo puede coincidir por
casualidad entre dos gastos no relacionados (ej. dos gastos de $500 el mismo
día, sin ninguna relación entre sí); fusionarlos sin una segunda señal sería
repetir el mismo problema de precisión que este proyecto busca resolver.

> **Asunción a validar en implementación:** el dedupe solo aplica *entre*
> fuentes distintas — nunca deduplica dos movimientos legítimos de la
> **misma** fuente el mismo día.

### Manejo de fallos

Si un email no puede parsearse (formato no reconocido, cambio del banco),
**nunca se descarta silenciosamente**: queda visible en un panel de "no
procesados" para carga manual y detección del patrón roto. El mismo panel
cubre cualquier webhook de Mailgun que llegue malformado o no se pueda
procesar por otro motivo.

## Requisitos funcionales (heredados, siguen vigentes)

1. Alta de transacciones
   - Debe permitir crear ingresos y gastos (manual, además de automático).
   - Debe validar que descripción, monto y fecha sean obligatorios.
   - Debe normalizar el payload antes de guardar.
   - Debe guardar la transacción en la base (ahora Postgres, no local).

2. Visualización
   - El dashboard debe mostrar saldo total, porcentaje de salud financiera y
     presupuesto mensual.
   - La pantalla de transacciones debe listar las últimas transacciones y
     permitir filtrar por categoría.
   - La pantalla de gráficos debe mostrar gastos agrupados por categoría.

3. Gestión de categorías
   - Ver sección "Categorías" arriba.

4. Metas
   - Debe permitir guardar un presupuesto mensual y mostrar progreso.

5. Persistencia
   - Postgres (Neon) vía backend, no más IndexedDB/localStorage como fuente
     de verdad. (Se puede evaluar cache local para uso offline en una etapa
     posterior — fuera de este spec.)

## Fuera de alcance (explícito)

- Multi-moneda
- Inversiones / plazo fijo
- Tarjetas de crédito
- Exportación AFIP / Ganancias
- Agregadores pagos (Belvo u otros)
- OAuth a Gmail / lectura directa de bandeja
- Migración de los datos de prueba actuales
- Multi-usuario, auth real, RLS — pospuesto a fase final (ver "Por qué se
  pospone el multi-usuario")

## Epic e issues hijos (orden de ejecución)

```
Fase 0 — Fundación (un solo usuario)
  #1 Backend (Vercel Functions) + Postgres/Neon + protección simple de acceso
  #2 Motor de categorías (constraint UNIQUE + upsert)

Fase 1 — MVP de ingesta (Mercado Pago, obligatorio)
  #3 Recepción de email vía Mailgun (verificación de firma) + parser
     genérico + parser Mercado Pago — precedido por spike de validación
     con emails reales
  #4 Validación server-side centralizada (reusa transactionPayload.js)
  #5 Categorización obligatoria en línea (UI)
  #6 Panel de no procesados

Fase 2 — Banco (Hipotecario primero)
  #7 Parser Banco Hipotecario (reusa el pipeline genérico de #3)
  #8 Deduplicación cross-fuente (monto+día en horario ART + señal de
     concepto/destinatario)

Fase 3 — Multi-usuario (pospuesta, sin fecha)
  #9 Auth real (magic link) + Row-Level Security en Postgres (validar antes
     el modo de connection pooling de Neon — RLS depende de que el contexto
     de usuario se propague correctamente por request) + mapeo de
     direcciones de ingesta a usuarios + alta manual de profesionales
```

**Decisión pendiente para Fase 3 (abierta, sin resolver):** SaaS compartido
con RLS (plan actual) vs. instancia propia auto-desplegada por cada
profesional (sin RLS, aislamiento automático por diseño, pero más fricción
de onboarding). Se retoma cuando se llegue a esta fase — no bloquea Fases
0-2.

**Sequencing rationale:** #1/#2 son prerrequisito de todo lo demás. Mercado
Pago va antes que el banco por ser obligatorio para el caso de uso principal.
El dedupe (#8) necesita dos fuentes activas simultáneamente para tener
sentido, por eso va después del parser de Hipotecario. Multi-usuario (#9)
queda al final, deliberadamente: se construye sobre un pipeline de ingesta
ya probado en producción, no antes.

### Fuera de este Epic (issue de seguimiento separado)

**OCR (Tesseract.js) para capturas/recibos sin email** — recortado en
`/plan-eng-review`. Motivo: es el canal de menor precisión, no bloquea el
objetivo principal, y agrega un componente entero (motor OCR + UI de carga
de imágenes + revisión manual más frecuente) sin validar primero si hace
falta en la práctica. Se retoma como issue propio si, después de usar las
Fases 0-2 en producción, se confirma que los gastos en efectivo sin rastro
de email son un problema real.

## Criterios de aceptación (nivel Epic, Fases 0-2)

1. Un movimiento de Mercado Pago reenviado por email aparece en la app sin
   carga manual, en estado "requiere categoría".
2. El webhook de Mailgun rechaza cualquier POST que no traiga una firma
   válida.
3. El usuario no puede dejar un movimiento auto-ingresado sin categorizar y
   perderlo de vista — la UI lo obliga a resolverlo en el lugar donde
   aparece.
4. Un movimiento que llega duplicado (banco + MP, mismo día, mismo monto Y
   concepto coincidente) se muestra una sola vez. Si solo coincide monto+día,
   se marca como "posible duplicado" para confirmación manual, no se fusiona
   solo.
5. Un email que el parser no reconoce (o un webhook malformado) queda
   visible en el panel de no procesados, nunca se pierde.
6. Se puede crear una transacción manual válida desde la interfaz (flujo
   heredado, sigue funcionando).
7. La validación server-side rechaza un payload inválido aunque venga
   directo a la API (sin pasar por el formulario).
8. La app no rompe al cargar sin datos previos.
9. La prueba de payload (normalización) pasa.

## Riesgo / Rollback

- Si el pipeline de email falla en producción, el usuario sigue pudiendo
  cargar a mano — no se elimina el flujo manual existente, se agrega
  automatización sobre él.
- Al arrancar la base en cero, no hay riesgo de corrupción de datos
  históricos.
- Postergar multi-usuario reduce el riesgo de construir aislamiento de datos
  (RLS) mal probado antes de tener usuarios reales que lo necesiten.

## Entregables

- Backend (Vercel Functions) + esquema Postgres (Neon) + protección de
  acceso simple (v1, un usuario).
- Motor de categorías con constraint de unicidad.
- Recepción de email vía Mailgun (con verificación de firma) + parser
  genérico + parser Mercado Pago + parser Banco Hipotecario.
- Validación server-side centralizada (un solo módulo, tres entry points).
- UI de categorización obligatoria en línea.
- Panel de no procesados.
- Motor de deduplicación (dos señales, timezone-aware).
- Módulo de normalización de transacciones (heredado, se mantiene).
- Base de pruebas: normalización + parsers de ingesta + dedupe (incluyendo
  el caso borde de timezone y el caso de falso positivo por monto+día).

> OCR y multi-usuario fuera de este Epic — ver secciones correspondientes
> arriba.

---

## Historial de revisión

- **2026-08-03 (primera pasada, `/spec`):** corrección de alcance completa.
  Se elimina el requisito "sin backend", ingesta automática (email), backend
  real (Vercel Functions + Postgres/Neon), desglose en Epic.
- **2026-08-03 (segunda pasada, `/plan-eng-review`):** recorte de OCR fuera
  del Epic. Hallazgos de arquitectura resueltos: recepción de email vía
  Mailgun + verificación de firma, validación server-side centralizada,
  constraint UNIQUE + upsert en categorías, dedupe timezone-aware con
  segunda señal anti-falso-positivo. **Repliegue mayor:** multi-usuario
  (auth + RLS) pospuesto a Fase 3 — v1 es una herramienta de automatización
  personal, no una plataforma multi-tenant, para no cargar el riesgo de
  infraestructura de auth antes de validar que el parser de ingesta
  funciona con emails reales.
