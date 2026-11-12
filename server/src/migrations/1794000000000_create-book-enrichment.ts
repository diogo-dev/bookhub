import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

// Registra quais livros já passaram pelo script de enriquecimento (src/scripts/enrich_books.ts),
// para que ele possa ser interrompido e retomado sem reprocessar (e repagar) livros.
export const up = transaction(async (client: Client) => {
  await client.query(`
    CREATE TABLE book_enrichment (
      book_isbn VARCHAR(13) PRIMARY KEY,
      status VARCHAR(20) NOT NULL,
      model VARCHAR(100) NOT NULL,
      detail TEXT,
      enriched_at BIGINT NOT NULL DEFAULT (EXTRACT (EPOCH FROM NOW()) * 1000),
      FOREIGN KEY (book_isbn) REFERENCES book(isbn) ON DELETE CASCADE
    );
  `);
});

export const down = transaction(async (client: Client) => {
  await client.query("DROP TABLE book_enrichment;");
});
