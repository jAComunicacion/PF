const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no esta configurada (ver README/env de Vercel)');
}

// El driver HTTP de Neon abre una conexion por query en vez de mantener un
// pool persistente - evita por completo el problema de pooling + estado de
// sesion que discutimos para RLS (que de todos modos quedo pospuesto a Fase 3).
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
