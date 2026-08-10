-- Personal Count - reset de categorias (una sola vez)
--
-- Por que existe: api/categories/seed.js siembra la lista oficial SOLO si la
-- tabla esta vacia. La base ya tenia sembrada la lista generica original, asi
-- que cambiar defaultCategories.js no alcanzaba: habia que vaciar primero.
--
-- OJO: esto borra TODO. Julio confirmo que los movimientos cargados a mano
-- hasta ahora se pueden perder, porque el historial real entra despues desde
-- Microsoft Money (ver scripts/qif-a-sql.js).
--
-- transactions va primero por la foreign key a categories (001_init.sql).
-- RESTART IDENTITY para que los ids arranquen limpios de nuevo.

TRUNCATE transactions RESTART IDENTITY CASCADE;
TRUNCATE categories   RESTART IDENTITY CASCADE;
