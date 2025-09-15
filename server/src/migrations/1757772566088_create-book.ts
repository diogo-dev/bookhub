import { Client } from "pg";

export async function up({ context: client }: { context: Client }) {
  await client.query(`
    CREATE TABLE language (
      iso_code VARCHAR(35) PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    );
  `);

  await client.query(`
    CREATE TABLE publisher (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      address_id UUID REFERENCES address(id) NOT NULL,
      created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
    );
  `);

  await client.query(`
    CREATE TABLE author (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      biography TEXT NOT NULL,
      birth_date DATE NOT NULL,
      death_date DATE,
      created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
    );
  `);

  await client.query(`
    CREATE TABLE dewey_category (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID REFERENCES dewey_category(id),
      decimal DECIMAL(9, 6) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
    );
  `);

  await client.query(`
    CREATE TABLE book (
      isbn VARCHAR(13) PRIMARY KEY,
      parent_isbn VARCHAR(13),
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      description TEXT NOT NULL,
      publisher_id UUID,
      category_id UUID,
      language_code VARCHAR(35),
      edition VARCHAR(255) NOT NULL,
      number_of_pages INTEGER NOT NULL DEFAULT 0,
      number_of_visits INTEGER NOT NULL DEFAULT 0,
      published_at BIGINT NOT NULL,
      created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW())),
      FOREIGN KEY (parent_isbn) REFERENCES book(isbn) ON DELETE SET NULL,
      FOREIGN KEY (publisher_id) REFERENCES publisher(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES dewey_category(id) ON DELETE SET NULL,
      FOREIGN KEY (language_code) REFERENCES language(iso_code) ON DELETE SET NULL
    );
  `);

  await client.query(`
    CREATE TABLE book_item (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      isbn VARCHAR(13) REFERENCES book(isbn) NOT NULL,
      created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
    );
  `);

  await client.query(`
    CREATE TABLE book_author (
      book_isbn VARCHAR(13),
      author_id UUID,
      PRIMARY KEY (book_isbn, author_id),
      FOREIGN KEY (book_isbn) REFERENCES book(isbn) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES author(id) ON DELETE CASCADE
    );
  `);
}

export async function down({ context: client }: { context: Client }) {
  await client.query("DROP TABLE book_author;");
  await client.query("DROP TABLE book_item;");
  await client.query("DROP TABLE book;");
  await client.query("DROP TABLE dewey_category;");
  await client.query("DROP TABLE author;");
  await client.query("DROP TABLE publisher;");
  await client.query("DROP TABLE language;");
}
