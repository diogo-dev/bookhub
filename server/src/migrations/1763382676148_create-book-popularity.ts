import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {
  await client.query(`
    CREATE MATERIALIZED VIEW book_popularity AS
    SELECT
      book.*,
      (
        book.number_of_visits * 0.1 +
        COALESCE(AVG(rating.score), 0) * 3 +
        COUNT(rating.score) * 0.5
      ) AS popularity_score
    FROM book
    LEFT JOIN rating ON rating.book_isbn = book.isbn
    GROUP BY book.isbn, book.number_of_visits;
  `);

  await client.query("CREATE UNIQUE INDEX idx_book_popularity_isbn ON book_popularity(isbn);");
});

export const down = transaction(async (client: Client) => {
  await client.query("DROP INDEX idx_book_popularity_isbn;");
  await client.query("DROP MATERIALIZED VIEW book_popularity;");
});
