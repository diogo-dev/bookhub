import { Client } from "pg";

export async function up({ context: client }: { context: Client }) {
  // trigram for fuzzy search
  // and unaccent to remove diacritics
  await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
  await client.query("CREATE EXTENSION IF NOT EXISTS unaccent;");

 await client.query("ALTER TABLE book ADD COLUMN search_vector tsvector;");

  // create a vector with title, subtitle and description tokens
  // (title have priority over subtitle and subtitle over description)
  await client.query(`
    CREATE OR REPLACE FUNCTION book_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.title, ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.subtitle, ''))), 'B') ||
        setweight(to_tsvector('simple', unaccent(coalesce(NEW.description, ''))), 'C');
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql;
  `);

  await client.query(`
    CREATE TRIGGER book_search_vector_tsvector_update
    BEFORE INSERT OR UPDATE ON book
    FOR EACH ROW
    EXECUTE FUNCTION book_search_vector_update();
  `);

  // use generic inverse index for effective text search
  await client.query("CREATE INDEX idx_book_search_vector ON book USING GIN (search_vector);");

  // use title trigram for fuzzy search
  await client.query("CREATE INDEX idx_book_title_trgm ON book USING GIN (title gin_trgm_ops);");
}

export async function down({ context: client }: { context: Client }) {
  await client.query("DROP TRIGGER book_search_vector_tsvector_update ON book;");
  await client.query("DROP FUNCTION book_search_vector_update;");
  await client.query("DROP INDEX idx_book_search_vector;");
  await client.query("DROP INDEX idx_book_title_trgm;");
  await client.query("ALTER TABLE book DROP COLUMN search_vector;");

  await client.query("DROP EXTENSION unaccent;");
  await client.query("DROP EXTENSION pg_trgm;");
}
