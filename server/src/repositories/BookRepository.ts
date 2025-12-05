import { Book } from "@/domain/Book";

export interface BookRepository {
  save(book: Book): Promise<void>;
  find(isbn: string): Promise<Book | null>;
  findByText(query: string, limit?: number): Promise<Book[]>;
  listCatalog(options?: { booksPerRow?: number; }): Promise<Record<string, Book[]>>;
  delete(isbn: string): Promise<void>;
}
