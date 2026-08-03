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
