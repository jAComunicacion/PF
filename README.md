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
