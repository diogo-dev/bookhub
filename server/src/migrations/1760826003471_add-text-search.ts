import { Client } from "pg";

export async function up({ context: client }: { context: Client }) {
  // trigram for fuzzy search
  // and unaccent to remove diacritics
  await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
  await client.query("CREATE EXTENSION IF NOT EXISTS unaccent;");

  // create a vector with title, subtitle and description tokens
  // (title have priority over subtitle and subtitle over description)
  await client.query(`
    ALTER TABLE book
    ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', unaccent(coalesce(title, ''))), 'A') ||
      setweight(to_tsvector('simple', unaccent(coalesce(subtitle, ''))), 'B') ||
      setweight(to_tsvector('simple', unaccent(coalesce(description, ''))), 'C')
    ) STORED;
  `);

  // use generic inverse index for effective text search
  await client.query("CREATE INDEX idx_book_search_vector ON book USING GIN (search_vector);");

  // use title trigram for fuzzy search
  await client.query("CREATE INDEX idx_book_title_trgm ON book USING GIN (title gin_trgm_ops);");
}

export async function down({ context: client }: { context: Client }) {
  await client.query("DROP INDEX idx_book_title_trgm;");
  await client.query("DROP INDEX idx_book_search_vector;");

  await client.query("DROP EXTENSION unaccent;");
  await client.query("DROP EXTENSION pg_trgm;");
}
