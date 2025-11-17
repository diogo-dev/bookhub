import { BookDTO } from "../../domain/BookDTO";
import { loadJSONL } from "./loadJSONL";
import { Publisher } from "../../domain/Publisher";
import { Genre } from "../../domain/Genre";
import { recordsTemplate } from "../pg/templates";
import { client } from "../pg/connection";

export async function loadBooks(params: {
  workMapping: Map<string, string>;
  authorMapping: Map<string, string>;
}) {
  await loadJSONL<BookDTO>({
    relativePath: "data/books.jsonl",
    store: async (books: BookDTO[]) => {
      // INSERT PUBLISHERS
      const publisherProps = [];
      for (const book of books) {
        if (book.publisher) {
          const publisher = new Publisher();
          publisher.displayName = book.publisher;
          publisherProps.push(publisher.name, publisher.displayName, publisher.createdAt);
        }
      }

      let template = recordsTemplate({
        numberOfRecords: publisherProps.length / 3,
        sizeOfRecord: 3,
        casting: ["varchar", "varchar", "bigint"]
      });

      await client.query(
        `INSERT INTO publisher (name, display_name, created_at) VALUES ${template} ON CONFLICT DO NOTHING;`,
        publisherProps
      )

      // INSERT BOOKS
      const categoryQuery = await client.query("SELECT id, decimal FROM dewey_category WHERE level = 2;");
      const categoryMapping = new Map<string, string>(categoryQuery.rows.map(row => [row.decimal, row.id]));

      const bookProps = [];
      const bookItems = [];
      for (const book of books) {
        bookProps.push(
          book.ISBN,
          book.workID ? params.workMapping.get(book.workID) : null,
          book.title,
          book.subtitle,
          book.description,
          book.cover,
          book.publisher ? book.publisher.toLowerCase().trim() : null,
          book.category ? categoryMapping.get(book.category) : null,
          book.language,
          book.edition,
          book.numberOfPages,
          book.numberOfVisits,
          book.publishedAt,
          book.createdAt
        );

        for (const itemID of book.items) {
          bookItems.push(itemID, book.ISBN, Date.now());
        }
      }

      template = recordsTemplate({
        numberOfRecords: bookProps.length / 14,
        sizeOfRecord: 14,
        casting: [
          "varchar",
          "uuid",
          "varchar",
          "varchar",
          "text",
          "varchar",
          "varchar",
          "uuid",
          "varchar",
          "varchar",
          "int",
          "int",
          "bigint",
          "bigint"
        ]
      });

      await client.query(`
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
        ) VALUES ${template} ON CONFLICT DO NOTHING;`,
        bookProps
      );

      template = recordsTemplate({
        numberOfRecords: bookItems.length / 3,
        sizeOfRecord: 3,
        casting: ["uuid", "varchar", "bigint"]
      });

      await client.query(
        `INSERT INTO book_item (id, isbn, created_at) VALUES ${template};`,
        bookItems
      );

      // INSERT AUTHORS
      const bookAuthors = [];
      for (const book of books) {
        for (const authorRef of book.authors) {
          const authorID = params.authorMapping.get(authorRef);
          if (authorID == undefined) throw new Error(`Author ${authorRef} not found`);

          bookAuthors.push(book.ISBN, authorID);
        }
      }

      template = recordsTemplate({
        numberOfRecords: bookAuthors.length / 2,
        sizeOfRecord: 2,
        casting: ["varchar", "varchar"]
      });

      await client.query(
        `INSERT INTO book_author (book_isbn, author_id) VALUES ${template};`,
        bookAuthors
      );

      // INSERT GENRES
      const genreProps: string[] = [];
      const bookGenres: string[] = [];
      for (const book of books) {
        for (const displayName of book.genres) {
          const genre = new Genre();
          genre.displayName = displayName;

          genreProps.push(genre.name, genre.displayName);
          if (book.ISBN) bookGenres.push(book.ISBN, genre.name);
        }
      }

      template = recordsTemplate({
        numberOfRecords: genreProps.length / 2,
        sizeOfRecord: 2,
        casting: ["varchar", "varchar"]
      })

      await client.query(
        `INSERT INTO genre (name, display_name) VALUES ${template} ON CONFLICT DO NOTHING;`,
        genreProps
      );

      template = recordsTemplate({
        numberOfRecords: bookGenres.length / 2,
        sizeOfRecord: 2,
        casting: ["varchar", "varchar"]
      });

      await client.query(
        `INSERT INTO book_genre (book_isbn, genre) VALUES ${template} ON CONFLICT DO NOTHING;`,
        bookGenres
      );
    }
  });
}
