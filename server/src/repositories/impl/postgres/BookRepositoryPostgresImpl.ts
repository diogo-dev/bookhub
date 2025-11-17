import { Book } from "@/domain/Book";
import { BookItem } from "@/domain/BookItem";
import { Author } from "@/domain/Author";
import { Publisher } from "@/domain/Publisher";
import { Language } from "@/domain/Language";
import { DeweyCategory } from "@/domain/DeweyCategory";
import { Genre } from "@/domain/Genre";
import { BookRepository } from "@/repositories/BookRepository";
import { AuthorRecord } from "@/repositories/impl/postgres/AuthorRepositoryPostgresImpl";
import { PublisherRecord } from "@/repositories/impl/postgres/PublisherRepositoryPostgresImpl";
import { DeweyCategoryRecord } from "@/repositories/impl/postgres/CategoryRepositoryPostgresImpl";
import { GenreRecord } from "./GenreRepositoryPostgresImpl";
import { LanguageRecord } from "@/repositories/impl/postgres/LanguageRepositoryPostgresImpl";
import { BookItemRecord } from "@/repositories/impl/postgres/ItemRepositoryPostgresImpl";
import { Client } from "pg";

interface BookRecord {
  isbn: string;
  work_id: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover: string | null;
  edition: string | null;
  number_of_pages: number;
  number_of_visits: number;
  published_at: number | null;
  created_at: string;

  genres: GenreRecord[];
  authors: AuthorRecord[];
  publisher: PublisherRecord | null;
  category: DeweyCategoryRecord | null;
  language: LanguageRecord | null;
  items: BookItemRecord[];
}

export class BookRepositoryPostgresImpl implements BookRepository {
  constructor(private client: Client) {}

  private async query(isbn: string) {
    return await this.client.query(`
      SELECT
        b.isbn,
        b.work_id,
        b.title,
        b.subtitle,
        b.description,
        b.cover,
        b.edition,
        b.number_of_pages,
        b.number_of_visits,
        b.published_at,
        b.created_at,

        COALESCE(genres.obj, '[]') AS genres,
        COALESCE(authors.obj, '[]') AS authors,
        COALESCE(items.obj, '[]') AS items,

        -- Publisher (one-to-many)
        json_build_object(
          'name', p.name,
          'display_name', p.display_name,
          'created_at', p.created_at
        ) AS publisher,

        -- Language (one-to-many)
        json_build_object(
          'iso_code', l.iso_code,
          'name', l.name
        ) AS language,

        -- Category (one-to-many)
        json_build_object(
          'id', c.id,
          'parent_id', c.parent_id,
          'decimal', c.decimal,
          'name', c.name,
          'created_at', c.created_at
        ) AS category

      FROM book b

      LEFT JOIN publisher p ON p.name = b.publisher_name
      LEFT JOIN language l ON l.iso_code = b.language_code
      LEFT JOIN dewey_category c ON c.id = b.category_id

      -- Genres (many-to-many)
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'name', g.name,
            'display_name', g.display_name
          )
        ) AS obj
        FROM book_genre bg
        JOIN genre g ON bg.genre = g.name
        WHERE bg.book_isbn = b.isbn
      ) genres ON TRUE

      -- Authors (many-to-many)
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', a.id,
            'name', a.name,
            'biography', a.biography,
            'birth_date', a.birth_date,
            'death_date', a.death_date,
            'created_at', a.created_at
          )
        ) AS obj
        FROM book_author ba
        JOIN author a ON ba.author_id = a.id
        WHERE ba.book_isbn = b.isbn
      ) authors ON TRUE

      -- Book items (one-to-many)
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', bi.id,
            'isbn', bi.isbn,
            'created_at', bi.created_at
          )
        ) AS obj
        FROM book_item bi
        WHERE bi.isbn = b.isbn
      ) items ON TRUE

      WHERE b.isbn = $1;`,
      [isbn]
    );
  }

  public async find(isbn: string): Promise<Book | null> {
    const result = await this.query(isbn);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async findByText(query: string, limit = 10): Promise<Book[]> {
    const textSearch = await this.client.query(`
      SELECT * FROM book
      WHERE search_vector @@ plainto_tsquery('simple', unaccent($1))
      ORDER BY ts_rank(search_vector, plainto_tsquery('simple', unaccent($1))) DESC
      LIMIT $2;`,
      [query, limit]
    );

    if (textSearch.rows.length > 0) {
      return textSearch.rows.map((row) => this.deserialize(row));
    } else {
      const fuzzySearch = await this.client.query(`
        SELECT * FROM book
        WHERE similarity(title, $1) > 0.3
        ORDER BY similarity(title, $1) DESC
        LIMIT $2;`,
        [query, limit]
      );

      return fuzzySearch.rows.map((row) => this.deserialize(row));
    }
  }

  public async save(book: Book): Promise<void> {
    const result = await this.query(book.ISBN);
    const recordExists = result.rows.length > 0;

    try {
      await this.client.query("BEGIN;");
      const genres = book.genres.map((genre) => genre.name);
      const authorIDs = book.authors.map((author) => author.ID);

      if (recordExists) {
        const insertedGenres = genres.map((_, index) => "$" + (index + 2)).join(",");
        const insertedAuthorIDs = authorIDs.map((_, index) => "$" + (index + 2)).join(",");

        await Promise.all([
          this.client.query(`
            UPDATE book SET
              work_id = $2,
              title = $3,
              subtitle = $4,
              description = $5,
              cover = $6,
              publisher_name = $7,
              category_id = $8,
              language_code = $9,
              edition = $10,
              number_of_pages = $11,
              number_of_visits = $12,
              published_at = $13,
            WHERE isbn = $1;`,
            [
              book.ISBN,
              book.workID,
              book.title,
              book.subtitle,
              book.description,
              book.cover,
              book.publisher ? book.publisher.name : null,
              book.category ? book.category.ID : null,
              book.language ? book.language.isoCode : null,
              book.edition,
              book.numberOfPages,
              book.numberOfVisits,
              book.publishedAt
            ]
          ),

          this.client.query(
            `DELETE FROM book_genre WHERE book_isbn = $1 AND genre_id NOT IN (${insertedGenres});`,
            [book.ISBN, ...genres]
          ),

          this.client.query(
            `DELETE FROM book_author WHERE book_isbn = $1 AND author_id NOT IN (${insertedAuthorIDs});`,
            [book.ISBN, ...authorIDs]
          )
        ]);
      } else {
        await this.client.query(`
          INSERT INTO book (
            isbn,
            work_id,
            title,
            subtitle,
            description,
            cover,
            publisher_name,
            category_id,
            language_code,
            edition,
            number_of_pages,
            number_of_visits,
            published_at,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);`,
          [
            book.ISBN,
            book.workID,
            book.title,
            book.subtitle,
            book.description,
            book.cover,
            book.publisher ? book.publisher.name : null,
            book.category ? book.category.ID : null,
            book.language ? book.language.isoCode : null,
            book.edition,
            book.numberOfPages,
            book.numberOfVisits,
            book.publishedAt,
            book.createdAt
          ]
        );
      }

      const genreInsertions = genres.map((_, index) => `($1, $${index + 2}::UUID)`).join(", ");
      const authorInsertions = authorIDs.map((_, index) => `($1, $${index + 2}::UUID)`).join(", ");

      await Promise.all([
        this.client.query(`
          INSERT INTO book_genre (book_isbn, genre) VALUES ${genreInsertions} ON CONFLICT DO NOTHING;`,
          [book.ISBN, ...genres]
        ),

        this.client.query(`
          INSERT INTO book_author (book_isbn, author_id) VALUES ${authorInsertions} ON CONFLICT DO NOTHING;`,
          [book.ISBN, ...authorIDs]
        )
      ]);

      await this.client.query("COMMIT;");
    } catch (error) {
      await this.client.query("ROLLBACK;");
      throw error;
    }
  }

  private deserialize(record: BookRecord): Book {
    const book = new Book();
    book.ISBN = record.isbn;
    book.workID = record.work_id;

    if (record.category) {
      book.category = new DeweyCategory();
      book.category.ID = record.category.id;
      book.category.parentID = record.category.parent_id;
      book.category.decimal = record.category.decimal;
      book.category.name = record.category.name;
      book.category.createdAt = Number(record.category.created_at);
    } else {
      book.category = null;
    }

    book.genres = [];
    for (const genreRecord of record.genres) {
      const genre = new Genre();
      genre.displayName = genreRecord.display_name;
      book.genres.push(genre);
    }

    book.title = record.title;
    book.subtitle = record.subtitle = "";
    book.description = record.description = "";
    book.cover = record.cover;

    book.authors = [];
    for (const authorRecord of record.authors) {
      const author = new Author(authorRecord.id);
      author.name = authorRecord.name;
      author.biography = authorRecord.biography;
      author.birthDate = authorRecord.birth_date ? new Date(authorRecord.birth_date) : null;
      author.deathDate = authorRecord.death_date ? new Date(authorRecord.death_date) : null;
      author.createdAt = Number(authorRecord.created_at);
      book.authors.push(author);
    }

    if (record.publisher) {
      book.publisher = new Publisher(Number(record.publisher.created_at));
      book.publisher.displayName = record.publisher.display_name;
    } else {
      record.publisher = null;
    }

    book.edition = record.edition;

    if (record.language) {
      book.language = new Language();
      book.language.isoCode = record.language.iso_code;
      book.language.name = record.language.name;
    } else {
      record.language = null;
    }

    book.numberOfPages = record.number_of_pages;
    book.numberOfVisits = record.number_of_visits;
    book.publishedAt = record.published_at;
    book.createdAt = Number(record.created_at);

    book.items = [];
    for (const itemRecord of record.items) {
      const bookItem = new BookItem(
        itemRecord.isbn,
        itemRecord.id,
        Number(itemRecord.created_at)
      );

      book.items.push(bookItem);
    }

    return book;
  }
}
