-- Personal Count - schema inicial (Fase 0, un solo usuario)
-- Ejecutar una sola vez contra la base Neon (SQL editor de Neon o psql).

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    parent_id   INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UNIQUE(name, type, parent_id) no alcanza para categorias de nivel superior:
-- Postgres trata cada NULL como distinto, asi que un UNIQUE normal no evita
-- duplicados cuando parent_id es NULL. Se usan dos indices parciales en su
-- lugar, uno para categorias de nivel superior y otro para subcategorias.
CREATE UNIQUE INDEX IF NOT EXISTS categories_unique_top
    ON categories (name, type)
    WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_unique_child
    ON categories (name, type, parent_id)
    WHERE parent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS transactions (
    id              SERIAL PRIMARY KEY,
    type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    name            TEXT NOT NULL,
    amount          NUMERIC(14, 2) NOT NULL,
    category_id     INTEGER NOT NULL REFERENCES categories(id),
    subcategory_id  INTEGER REFERENCES categories(id),
    date            DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_date_idx ON transactions (date);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions (category_id);
