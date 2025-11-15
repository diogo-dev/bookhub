import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {
  await client.query("DROP TABLE book_genre;");
  await client.query("DROP TABLE genre;");

  await client.query(`
    CREATE TABLE genre (
      name VARCHAR(255) PRIMARY KEY,
      display_name VARCHAR(255) NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE book_genre (
      book_isbn VARCHAR(13),
      genre VARCHAR(255),
      PRIMARY KEY (book_isbn, genre),
      FOREIGN KEY (book_isbn) REFERENCES book(isbn) ON DELETE CASCADE,
      FOREIGN KEY (genre) REFERENCES genre(name) ON DELETE CASCADE
    );
  `);
});

export const down = transaction(async (client: Client) => {
  await client.query("DROP TABLE book_genre;");
  await client.query("DROP TABLE genre;");

  await client.query(`
    CREATE TABLE genre (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE book_genre (
      book_isbn VARCHAR(255) REFERENCES book(isbn) NOT NULL,
      genre_id UUID REFERENCES genre(id) NOT NULL
    )
  `);
});
