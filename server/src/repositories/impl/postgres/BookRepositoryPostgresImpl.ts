import { Book } from "@/domain/Book";
import { BookItem } from "@/domain/BookItem";
import { Author } from "@/domain/Author";
import { Publisher } from "@/domain/Publisher";
import { Address } from "@/domain/Address";
import { Language } from "@/domain/Language";
import { DeweyCategory } from "@/domain/DeweyCategory";
import { BookRepository } from "@/repositories/BookRepository";
import { AuthorRecord } from "@/repositories/impl/postgres/AuthorRepositoryPostgresImpl";
import { PublisherRecord } from "@/repositories/impl/postgres/PublisherRepositoryPostgresImpl";
import { DeweyCategoryRecord } from "@/repositories/impl/postgres/CategoryRepositoryPostgresImpl";
import { LanguageRecord } from "@/repositories/impl/postgres/LanguageRepositoryPostgresImpl";
import { BookItemRecord } from "@/repositories/impl/postgres/ItemRepositoryPostgresImpl";
import { Client } from "pg";

interface BookRecord {
  isbn: string;
  parent_isbn: string;
  title: string;
  subtitle: string;
  description: string;
  edition: string;
  number_of_pages: number;
  number_of_visits: number;
  published_at: number;
  created_at: string;

  authors: AuthorRecord[];
  publisher: PublisherRecord;
  category: DeweyCategoryRecord;
  language: LanguageRecord;
  items: BookItemRecord[];
}

export class BookRepositoryPostgresImpl implements BookRepository {
  constructor(private client: Client) {}

  private async query(isbn: string) {
    return await this.client.query(`
      SELECT
        b.isbn,
        b.parent_isbn,
        b.title,
        b.subtitle,
        b.description,
        b.edition,
        b.number_of_pages,
        b.number_of_visits,
        b.published_at,
        b.created_at,

        COALESCE(authors.obj, '[]') AS authors,
        COALESCE(items.obj, '[]') AS items,

        -- Publisher (one-to-many)
        json_build_object(
          'id', p.id,
          'name', p.name,
          'created_at', p.created_at,
          'address', (
            SELECT json_build_object(
              'id', addr.id,
              'postal_code', addr.postal_code,
              'place_name', addr.place_name,
              'street_name', addr.street_name,
              'street_number', addr.street_number,
              'complement', addr.complement,
              'neighborhood', addr.neighborhood,
              'city', addr.city,
              'state', addr.state,
              'country', addr.country
            )
            FROM address addr
            WHERE addr.id = p.address_id
          )
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
          'description', c.description,
          'created_at', c.created_at
        ) AS category

      FROM book b

      LEFT JOIN publisher p ON p.id = b.publisher_id
      LEFT JOIN language l ON l.iso_code = b.language_code
      LEFT JOIN dewey_category c ON c.id = b.category_id

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

  public async save(book: Book): Promise<void> {
    const result = await this.query(book.ISBN);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE book SET parent_isbn = $2, title = $3, subtitle = $4, description = $5, publisher_id = $6, category_id = $7, language_code = $8, edition = $9, number_of_pages = $10, number_of_visits = $11, published_at = $12, WHERE isbn = $1;",
        [book.ISBN, book.parentISBN, book.title, book.subtitle, book.description, book.publisher.ID, book.category.ID, book.language.isoCode, book.edition, book.numberOfPages, book.numberOfVisits, book.publishedAt]
      );
    } else {
      await this.client.query("BEGIN");
      try {
        await this.client.query(
          "INSERT INTO book (isbn, parent_isbn, title, subtitle, description, publisher_id, category_id, language_code, edition, number_of_pages, number_of_visits, published_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);",
          [book.ISBN, book.parentISBN, book.title, book.subtitle, book.description, book.publisher.ID, book.category.ID, book.language.isoCode, book.edition, book.numberOfPages, book.numberOfVisits, book.publishedAt, book.createdAt]
        );

        const authorsPlaceholder = book.authors.map((_, index) => `($1, $${index + 2}::UUID)`).join(", ");

        await this.client.query(`
          INSERT INTO book_author (book_isbn, author_id) VALUES ${authorsPlaceholder};`,
          [book.ISBN, ...book.authors.map(author => author.ID)]
        );

        await this.client.query("COMMIT");
      } catch (error) {
        await this.client.query("ROLLBACK");
        throw error;
      }
    }
  }

  private deserialize(record: BookRecord): Book {
    const book = new Book();
    book.ISBN = record.isbn;
    book.parentISBN = record.parent_isbn;

    book.category = new DeweyCategory();
    book.category.ID = record.category.id;
    book.category.parentID = record.category.parent_id;
    book.category.decimal = Number(record.category.decimal);
    book.category.name = record.category.name;
    book.category.description = record.category.description;
    book.category.createdAt = Number(record.category.created_at);

    book.title = record.title;
    book.subtitle = record.subtitle;
    book.description = record.description;

    book.authors = [];
    for (const authorRecord of record.authors) {
      const author = new Author(authorRecord.id);
      author.name = authorRecord.name;
      author.biography = authorRecord.biography;
      author.birthDate = new Date(authorRecord.birth_date);
      author.deathDate = authorRecord.death_date ? new Date(authorRecord.death_date) : null;
      author.createdAt = Number(authorRecord.created_at);
      book.authors.push(author);
    }

    book.publisher = new Publisher(record.publisher.id);
    book.publisher.name = record.publisher.name;
    book.publisher.createdAt = Number(record.publisher.created_at);
    book.publisher.address = new Address();
    book.publisher.address.ID = record.publisher.address.id;
    book.publisher.address.postalCode = record.publisher.address.postal_code;
    book.publisher.address.placeName = record.publisher.address.place_name;
    book.publisher.address.streetName = record.publisher.address.street_name;
    book.publisher.address.streetNumber = record.publisher.address.street_number;
    book.publisher.address.complement = record.publisher.address.complement;
    book.publisher.address.neighborhood = record.publisher.address.neighborhood;
    book.publisher.address.city = record.publisher.address.city;
    book.publisher.address.state = record.publisher.address.state;
    book.publisher.address.country = record.publisher.address.country;

    book.edition = record.edition;

    book.language = new Language();
    book.language.isoCode = record.language.iso_code;
    book.language.name = record.language.name;

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
