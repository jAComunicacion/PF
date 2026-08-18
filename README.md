# Personal Count

App de finanzas personales con ingesta automática de movimientos (ver `spec.md`
para el alcance completo). Este README cubre solo el setup del backend
(Fase 0).

## Variables de entorno

Configurar en Vercel (Project Settings → Environment Variables) y en un
`.env.local` para desarrollo local (nunca se commitea, ver `.gitignore`):

| Variable | Para qué sirve | Cómo se genera |
|---|---|---|
| `DATABASE_URL` | Connection string de Neon | Panel de Neon → Connection Details |
| `APP_PASSWORD` | Contraseña única de acceso a la app (v1, un solo usuario) | La elegís vos |
| `SESSION_SECRET` | Firma las cookies de sesión | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

A partir de Fase 1 (ingesta por email) se suman:

| Variable | Para qué sirve | Valor |
|---|---|---|
| `IMAP_HOST` | Servidor de la casilla de ingesta | `a0171005.ferozo.com` |
| `IMAP_PORT` | Puerto IMAP sobre SSL | `993` |
| `IMAP_USER` | Casilla de ingesta | `movimientos@jacomunicacion.com.ar` |
| `IMAP_PASSWORD` | Contraseña de esa casilla | Panel de Ferozo |
| `INGEST_TOKEN` | Autoriza al cron a disparar la ingesta | `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"` |

## Marca

Archivos en `assets/logos/`. **El logo nunca se recompone con tipografía** —
las letras "jA" escritas con una fuente no son el logo. Toda aparición de la
marca usa uno de estos archivos:

| Archivo | Qué es | Dónde va |
|---|---|---|
| `IsoLogojAComunicacion.png` | Isotipo en **outline** blanco, fondo transparente | Marcas de agua sobre fondos oscuros (hoy: tarjeta de saldo) |
| `jacomunicacion.jpg` | Isotipo sólido, blanco sobre verde petróleo | Versión principal — favicon, ícono de app, avatar |
| `LogusjAComunicacion.png` | Logotipo horizontal "jA Comunicacion" | Firmas, encabezados de documentos, export PDF |

## Base de datos

1. Crear un proyecto en [Neon](https://neon.tech).
2. Copiar la connection string a `DATABASE_URL`.
3. Ejecutar `db/001_init.sql` una vez contra esa base (SQL editor de Neon, o
   `psql "$DATABASE_URL" -f db/001_init.sql`).

## Backend (Vercel Functions)

```
api/
  _lib/
    db.js                  # conexión a Neon (driver HTTP, sin pooling)
    auth.js                 # password + cookie de sesión firmada
    validateTransaction.js  # validación server-side única (Fase 0)
  auth/login.js             # POST — valida password, emite cookie
  categories/index.js       # GET/POST — categorías (constraint UNIQUE)
  transactions/index.js     # GET/POST — transacciones
```

## Despliegue y dominio

La app vive en **Vercel**. URL de origen:
`https://finanzas-xi-orcin.vercel.app`

Dominio definitivo: **`finanzas.jacomunicacion.com.ar`**, en subdominio para
dejar la raíz libre para el sitio del estudio.

Se apunta con un **CNAME en la zona DNS** (Ferozo → Dominios → Zona DNS), no
creando un subdominio en el hosting — eso lo apuntaría a Ferozo, no a Vercel:

```
Tipo:    CNAME
Nombre:  finanzas
Destino: el que indique Vercel (Settings → Domains), típicamente
         cname.vercel-dns.com
```

**Los registros MX no se tocan.** El correo sigue en Ferozo y de eso depende
la ingesta (ver `spec.md`, "Recepción de email").

## Alta de un cliente nuevo (modelo "instancia por cliente")

Este repo no es multi-tenant: no hay tabla de usuarios ni aislamiento de
datos por cuenta (ver `db/001_init.sql`). Para vender esto a otro cliente
(pyme o profesional autónomo) **no se agregan cuentas dentro de esta
instancia** — se clona el patrón completo, igual al que ya corre para
`finanzas.jacomunicacion.com.ar`. Cada cliente queda con su propia base
de datos y su propio deploy: cero código compartido, cero riesgo de que un
cliente vea datos de otro.

Checklist, en orden:

1. **Base de datos**
   - Crear un proyecto nuevo en Neon.
   - Copiar la connection string.
   - Correr contra esa base, en orden: `db/001_init.sql`, luego
     `db/002_settings.sql`.
   - Sembrar las categorías por defecto (`api/categories/seed.js` /
     `api/_lib/defaultCategories.js`) — se dispara solo la primera vez que
     el frontend pide categorías y la tabla está vacía.

2. **Deploy**
   - Importar este repo como proyecto nuevo en Vercel (o duplicar el
     existente).
   - Configurar las env vars propias del cliente: `DATABASE_URL` (de este
     Neon nuevo), `APP_PASSWORD` (contraseña propia del cliente, no
     reusar la de otro), `SESSION_SECRET` (generar uno nuevo, ver tabla de
     variables más arriba — nunca reusar el de otra instancia).

3. **Dominio**
   - Subdominio bajo el dominio de jA: `<cliente>.jacomunicacion.com.ar`
     (mismo mecanismo que `finanzas.jacomunicacion.com.ar`, ver sección
     "Despliegue y dominio").
   - CNAME en la zona DNS apuntando a Vercel — no crear el subdominio en
     el hosting de dominios, o apunta al lugar equivocado.

4. **Entrega**
   - Pasarle al cliente la URL y su `APP_PASSWORD`.
   - Cargar (o pedirle que cargue) sus primeros movimientos para validar
     que categorías, presupuesto e informes calculan bien con datos reales
     de esa cuenta.

**Cuándo dejar de repetir este proceso a mano:** si el número de clientes
crece al punto de que aplicar el mismo fix en N deploys separados cuesta
más tiempo por mes que construir aislamiento compartido (tabla `users` +
`user_id` en cada tabla + Row-Level Security en Postgres + sesión con
identidad en `api/_lib/auth.js`), ahí sí vale migrar a un modelo
multi-tenant real. No antes.

## Instalar y testear

```
npm install
npm test
```

## Estado

- [x] Backend + schema Postgres + protección de acceso simple (#1)
- [x] Motor de categorías con constraint de unicidad (#2)
- [ ] Frontend conectado al backend nuevo (hoy `assets/js/**` sigue usando
      IndexedDB local — la integración es el próximo paso, no está hecha
      todavía)
- [ ] Ingesta por email (Fase 1, ver `spec.md`)
