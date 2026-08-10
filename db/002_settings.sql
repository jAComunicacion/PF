-- Personal Count - Fase 1: ajustes de la app
-- Ejecutar en el SQL Editor de Neon (branch production, base neondb).
-- Es idempotente: correrlo dos veces no rompe ni borra nada.
--
-- El presupuesto mensual vivia en la tabla `settings` de Dexie (IndexedDB),
-- que no tenia equivalente en Postgres. Sin esto, al pasar la fuente de verdad
-- al servidor el presupuesto se perdia en cada dispositivo.
--
-- Se guarda como clave/valor de texto en vez de una columna `monthly_budget`
-- porque ya se sabe que vienen mas ajustes (nombre de usuario, moneda) y no
-- vale la pena una migracion de schema por cada uno.

CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
