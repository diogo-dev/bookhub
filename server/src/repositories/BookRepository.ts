import { Book } from "@/domain/Book";

export interface BookSummary {
  ISBN: string;
  title: string;
  subtitle: string | null;
  cover: string | null;
  authors: { ID: string; name: string }[];
  numberOfPages: number;
  numberOfVisits: number;
  publishedAt: number | null;
}

export interface BookStats {
  totalBooks: number;
  totalGenres: number;
  totalAuthors: number;
  availableItems: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ListBooksOptions {
  limit: number;
  offset: number;
  letter?: string;
}

export interface ListBooksByGenreOptions {
  genre: string;
  limit: number;
  offset: number;
  sortBy: "popularity" | "title" | "date" | "pages";
  sortOrder: "asc" | "desc";
  yearFrom?: number;
  yearTo?: number;
}

export interface BookRepository {
  save(book: Book): Promise<void>;
  find(isbn: string): Promise<Book | null>;
  findByText(query: string, limit?: number): Promise<Book[]>;
  listCatalog(options?: { booksPerRow?: number; }): Promise<Record<string, Book[]>>;
  listPaginated(options: ListBooksOptions): Promise<PaginatedResult<BookSummary>>;
  listByGenre(options: ListBooksByGenreOptions): Promise<PaginatedResult<BookSummary>>;
  getStats(): Promise<BookStats>;
  delete(isbn: string): Promise<void>;
}
