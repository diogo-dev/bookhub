import { BookRepository } from "@/repositories/BookRepository";
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
}
