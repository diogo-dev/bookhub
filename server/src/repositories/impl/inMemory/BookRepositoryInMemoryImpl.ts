import { BookRepository } from "@/repositories/BookRepository";
import { Book } from "@/domain/Book";

export class BookRepositoryInMemoryImpl implements BookRepository {
  private books: Map<string, Book> = new Map();

  public async find(isbn: string): Promise<Book | null> {
    return this.books.get(isbn) || null;
  }

  public async save(book: Book): Promise<void> {
    this.books.set(book.ISBN, book);
  }
}
