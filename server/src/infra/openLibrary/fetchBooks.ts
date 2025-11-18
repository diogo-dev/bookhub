import fs from "fs/promises";
import path from "path";
import striptags from "striptags";
import { BookDTO } from "../../domain/BookDTO";
import { downloadDump } from "./downloadDump";
import { MARC21ToISO6393 } from "./languageMapping";
import { isValid } from "date-fns";

interface BookOpenLibraryImpl {
  ref: string;
  isbn_10?: string[];
  isbn_13?: string[];

  works?: [{  key: string; }];

  genres?: string[];
  dewey_decimal_class?: string[];

  title?: string;
  subtitle?: string;
  description?: { value: string; };

  covers?: number[];

  publishers?: string[];
  authors?: { key: string; }[];

  edition_name?: string;
  languages?: { key: string; }[];

  number_of_pages?: number;
  publish_date?: string;
}

export async function fetchBooksBy(refs: Set<string>): Promise<{
  bookAuthors: Map<string, string[]>
}> {
  const bookMapping = new Map<string, string>();
  const bookAuthors = new Map<string, string[]>();

  await downloadDump<BookOpenLibraryImpl, BookDTO | null>({
    name: "books",
    inputURL: "https://openlibrary.org/data/ol_dump_editions_latest.txt.gz",
    outputPath: "data/books.jsonl",
    parse: (line: string): BookOpenLibraryImpl => {
      const columns = line.split("\t");
      const ref = columns[1];
      const raw_json = columns[4];
      const {
        isbn_10,
        isbn_13,
        works,
        genres,
        dewey_decimal_class,
        title,
        subtitle,
        description,
        covers,
        authors,
        publishers,
        languages,
        edition_name,
        number_of_pages,
        publish_date
      } = JSON.parse(raw_json);

      return {
        ref,
        isbn_10,
        isbn_13,
        works,
        genres,
        dewey_decimal_class,
        title,
        subtitle,
        description,
        covers,
        authors,
        publishers,
        languages,
        edition_name,
        number_of_pages,
        publish_date
      };
    },
    adapt: (obj: BookOpenLibraryImpl): BookDTO | null => {
      const decimal = obj.dewey_decimal_class?.[0]?.match(/^\d{3}/)?.[0];
      const language = obj.languages?.[0]?.key?.match(/[^/]+$/)?.[0];
      const publishDate = new Date(obj.publish_date || "");

      const haveItems = Math.random() < 0.2;
      const numberOfItems = haveItems ? Math.floor(Math.random() * 5) + 1 : 0;
      const book: BookDTO = {
        ISBN: (obj.isbn_13?.[0] || obj.isbn_10?.[0] || "").replace(/\D/g, "").slice(0, 13),
        workID: obj.works?.[0].key || null,
        category: decimal || null,
        genres: obj.genres
          ? obj.genres.map(g => g.slice(0, 255))
          : [],
        title: obj.title ? obj.title.slice(0, 255) : "",
        subtitle: obj.subtitle ? obj.subtitle.slice(0, 255) : "",
        description: obj.description ? striptags(obj.description.value) : "",
        cover: obj.covers && obj.covers.length > 0 ? "/" + obj.covers?.[0] : null,
        authors: obj.authors
          ? obj.authors.map(a => a.key).filter(a => a != undefined)
          : [],
        publisher: (obj.publishers?.[0] || "").slice(0, 255),
        edition: (obj.edition_name || "").slice(0, 255),
        language: language ? MARC21ToISO6393(language) : null,
        numberOfPages: obj.number_of_pages || 0,
        numberOfVisits: 0,
        createdAt: Date.now(),
        publishedAt: isValid(publishDate) ? publishDate.getTime() : null,
        items: Array.from({ length: numberOfItems }, () => crypto.randomUUID())
      };

      if (book.ISBN && book.title && refs.has(obj.ref)) {
        bookMapping.set(obj.ref, book.ISBN);
        bookAuthors.set(book.ISBN, book.authors);
        return book;
      }

      else return null;
    }
  });

  fs.writeFile(
    path.resolve(__dirname, "data/book_mapping.csv"),
    Array.from(bookMapping).join("\n")
  );

  return { bookAuthors };
}
