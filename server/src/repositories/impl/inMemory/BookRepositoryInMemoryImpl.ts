import {
  BookRepository,
  BookStats,
  BookSummary,
  ListBooksByGenreOptions,
  ListBooksOptions,
  PaginatedResult,
} from "@/repositories/BookRepository";
import { Book } from "@/domain/Book";

export class BookRepositoryInMemoryImpl implements BookRepository {
  private books: Map<string, Book> = new Map();

  public async find(isbn: string): Promise<Book | null> {
    return this.books.get(isbn) || null;
  }

  public async findByText(query: string, limit: number = 10): Promise<Book[]> {
    return Array.from(this.books.values())
      .filter((book) => book.title.includes(query))
      .slice(0, limit);
  }

  public async listCatalog(options?: { booksPerRow?: number; }) {
    const booksPerRow = options?.booksPerRow || 8;

    let catalog: Record<string, Book[]> = {};

    // group books by genre
    for (const book of this.books.values()) {
      for (const genre of book.genres) {
        if (!catalog[genre.name])
          catalog[genre.name] = [];
        catalog[genre.name].push(book);
      }
    }

    // select top books
    for (const [genre, genreBooks] of Object.entries(catalog)) {
      genreBooks.sort((a, b) => b.numberOfVisits - a.numberOfVisits);
      catalog[genre] = genreBooks.slice(0, booksPerRow);
    }

    return catalog;
  }

  public async save(book: Book): Promise<void> {
    this.books.set(book.ISBN, book);
  }

  public async getStats(): Promise<BookStats> {
    const books = Array.from(this.books.values());
    const genres = new Set(books.flatMap(b => (b.genres ?? []).map(g => g.name)));
    const authors = new Set(books.flatMap(b => b.authors.map(a => a.ID)));
    const availableItems = books
      .flatMap(b => b.items ?? [])
      .filter(item => item.status === "disponivel").length;

    return { totalBooks: books.length, totalGenres: genres.size, totalAuthors: authors.size, availableItems };
  }

  public async listPaginated({ limit, offset, letter }: ListBooksOptions): Promise<PaginatedResult<BookSummary>> {
    const filtered = Array.from(this.books.values())
      .filter(b => !letter || b.title.charAt(0).toUpperCase() === letter.toUpperCase())
      .sort((a, b) => a.title.localeCompare(b.title));

    return { items: filtered.slice(offset, offset + limit).map(toSummary), total: filtered.length };
  }

  public async listByGenre(options: ListBooksByGenreOptions): Promise<PaginatedResult<BookSummary>> {
    const { genre, limit, offset, sortBy, sortOrder, yearFrom, yearTo } = options;
    const from = yearFrom ? new Date(yearFrom, 0, 1).getTime() / 1000 : -Infinity;
    const to = yearTo ? new Date(yearTo, 11, 31, 23, 59, 59).getTime() / 1000 : Infinity;

    const sortKey: Record<ListBooksByGenreOptions["sortBy"], (b: Book) => number | string> = {
      title: b => b.title,
      date: b => b.publishedAt ?? 0,
      pages: b => b.numberOfPages,
      popularity: b => b.numberOfVisits,
    };
    const key = sortKey[sortBy];
    const direction = sortOrder === "asc" ? 1 : -1;

    const filtered = Array.from(this.books.values())
      .filter(b => (b.genres ?? []).some(g => g.name.includes(genre)))
      .filter(b => (!yearFrom && !yearTo) || (b.publishedAt !== null && b.publishedAt >= from && b.publishedAt <= to))
      .sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * direction);

    return { items: filtered.slice(offset, offset + limit).map(toSummary), total: filtered.length };
  }

  public async delete(isbn: string): Promise<void> {
    this.books.delete(isbn);
  }
}

function toSummary(book: Book): BookSummary {
  return {
    ISBN: book.ISBN,
    title: book.title,
    subtitle: book.subtitle,
    cover: book.cover,
    authors: book.authors.map(a => ({ ID: a.ID, name: a.name })),
    numberOfPages: book.numberOfPages,
    numberOfVisits: book.numberOfVisits,
    publishedAt: book.publishedAt,
  };
}
