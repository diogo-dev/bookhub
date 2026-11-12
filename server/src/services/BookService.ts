import { Book } from "@/domain/Book";
import { BookItem } from "@/domain/BookItem";
import { Author } from "@/domain/Author";
import { DeweyCategory } from "@/domain/DeweyCategory";
import { Language } from "@/domain/Language";
import { Publisher } from "@/domain/Publisher";
import { HttpError } from "@/errors/HttpError";
import {
  BookRepository,
  BookStats,
  BookSummary,
  PaginatedResult,
} from "@/repositories/BookRepository";
import { ItemRepository } from "@/repositories/ItemRepository";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { AuthorRepository } from "@/repositories/AuthorRepository";
import { PublisherRepository } from "@/repositories/PublisherRepository";
import { LanguageRepository } from "@/repositories/LanguageRepository";
import {
  CreateBookData,
  ListBooksByGenreQuery,
  ListBooksQuery,
  UpdateBookData,
} from "@/schemas/bookSchemas";

export interface BookDetails {
  book: Book;
  categoryTree: DeweyCategory[] | null;
}

export class BookService {
  constructor(
    private bookRepository: BookRepository,
    private itemRepository: ItemRepository,
    private categoryRepository: CategoryRepository,
    private authorRepository: AuthorRepository,
    private publisherRepository: PublisherRepository,
    private languageRepository: LanguageRepository,
  ) {}

  async getStats(): Promise<BookStats> {
    return this.bookRepository.getStats();
  }

  async getCatalog(): Promise<Record<string, Book[]>> {
    return this.bookRepository.listCatalog();
  }

  async listPaginated(options: ListBooksQuery): Promise<PaginatedResult<BookSummary>> {
    return this.bookRepository.listPaginated(options);
  }

  async listByGenre(genre: string, options: ListBooksByGenreQuery): Promise<PaginatedResult<BookSummary>> {
    return this.bookRepository.listByGenre({ genre, ...options });
  }

  async search(query: string, limit: number): Promise<Book[]> {
    return this.bookRepository.findByText(query, limit);
  }

  async getByIsbn(isbn: string): Promise<Book> {
    const book = await this.bookRepository.find(isbn);
    if (!book) throw new HttpError(404, "book not found");
    return book;
  }

  async getDetails(isbn: string): Promise<BookDetails> {
    const book = await this.getByIsbn(isbn);
    const categoryTree = book.category
      ? await this.categoryRepository.findHierarchy(book.category.decimal)
      : null;

    return { book, categoryTree };
  }

  async create(data: CreateBookData): Promise<Book> {
    const existing = await this.bookRepository.find(data.ISBN);
    if (existing) throw new HttpError(400, "ISBN already registered");

    if (data.workID) await this.ensureWorkExists(data.workID);

    const [category, authors, publisher, language] = await Promise.all([
      data.categoryID ? this.resolveCategory(data.categoryID) : null,
      this.resolveAuthors(data.authorIDs),
      data.publisherName ? this.resolvePublisher(data.publisherName) : null,
      data.languageCode ? this.resolveLanguage(data.languageCode) : null,
    ]);

    const book = new Book();
    book.ISBN = data.ISBN;
    book.workID = data.workID || null;
    book.category = category;
    book.genres = [];
    book.title = data.title;
    book.subtitle = data.subtitle || "";
    book.description = data.description || "";
    book.cover = data.cover || null;
    book.authors = authors;
    book.publisher = publisher;
    book.edition = data.edition || "";
    book.language = language;
    book.numberOfPages = data.numberOfPages;
    book.numberOfVisits = 0;
    book.publishedAt = data.publishedAt ? data.publishedAt.getTime() : null;
    book.items = [];

    await this.bookRepository.save(book);
    return book;
  }

  async update(isbn: string, data: UpdateBookData): Promise<Book> {
    const book = await this.getByIsbn(isbn);

    if (data.workID !== undefined) {
      if (data.workID) await this.ensureWorkExists(data.workID);
      book.workID = data.workID || null;
    }

    if (data.categoryID !== undefined) {
      book.category = data.categoryID ? await this.resolveCategory(data.categoryID) : null;
    }

    if (data.authorIDs !== undefined) {
      book.authors = await this.resolveAuthors(data.authorIDs);
    }

    if (data.publisherName !== undefined) {
      book.publisher = data.publisherName ? await this.resolvePublisher(data.publisherName) : null;
    }

    if (data.languageCode !== undefined) {
      book.language = data.languageCode ? await this.resolveLanguage(data.languageCode) : null;
    }

    if (data.title !== undefined) book.title = data.title;
    if (data.subtitle !== undefined) book.subtitle = data.subtitle || "";
    if (data.description !== undefined) book.description = data.description || "";
    if (data.cover !== undefined) book.cover = data.cover || null;
    if (data.edition !== undefined) book.edition = data.edition || "";
    if (data.numberOfPages !== undefined) book.numberOfPages = data.numberOfPages;
    if (data.publishedAt !== undefined) {
      book.publishedAt = data.publishedAt ? data.publishedAt.getTime() : null;
    }

    await this.bookRepository.save(book);
    return book;
  }

  async delete(isbn: string): Promise<void> {
    await this.getByIsbn(isbn);
    await this.bookRepository.delete(isbn);
  }

  async listItems(isbn: string): Promise<BookItem[]> {
    return this.itemRepository.findByISBN(isbn);
  }

  async addItems(isbn: string, quantity: number): Promise<BookItem[]> {
    const book = await this.bookRepository.find(isbn);
    if (!book) throw new HttpError(400, "book not found");

    const items = Array.from({ length: quantity }, () => new BookItem(isbn));
    await Promise.all(items.map(item => this.itemRepository.save(item)));

    return items;
  }

  private async ensureWorkExists(workID: string): Promise<void> {
    const work = await this.bookRepository.find(workID);
    if (!work) throw new HttpError(400, "related work not found");
  }

  private async resolveCategory(id: string): Promise<DeweyCategory> {
    const category = await this.categoryRepository.find(id);
    if (!category) throw new HttpError(400, "category not found");
    return category;
  }

  private async resolveAuthors(ids: string[]): Promise<Author[]> {
    return Promise.all(
      ids.map(async id => {
        const author = await this.authorRepository.find(id);
        if (!author) throw new HttpError(400, "author not found: " + id);
        return author;
      })
    );
  }

  private async resolvePublisher(name: string): Promise<Publisher> {
    const publisher = await this.publisherRepository.find(name);
    if (!publisher) throw new HttpError(400, "publisher not found");
    return publisher;
  }

  private async resolveLanguage(code: string): Promise<Language> {
    const language = await this.languageRepository.find(code);
    if (!language) throw new HttpError(400, "language not found");
    return language;
  }
}
