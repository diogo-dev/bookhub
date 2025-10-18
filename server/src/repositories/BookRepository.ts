import { Book } from "@/domain/Book";

export interface BookRepository {
  save(book: Book): Promise<void>;
  find(isbn: string): Promise<Book | null>;
  findByText(query: string, limit?: number): Promise<Book[]>;
}
