import { Book } from "@/domain/Book";
import { BookItem } from "@/domain/BookItem";
import { DeweyCategory } from "@/domain/DeweyCategory";
import { BookSummary, PaginatedResult } from "@/repositories/BookRepository";

const toAuthorRef = (author: { ID: string; name: string }) => ({ ID: author.ID, name: author.name });

const toPublisherRef = (book: Book) =>
  book.publisher ? { name: book.publisher.name, displayName: book.publisher.displayName } : null;

const toLanguageRef = (book: Book) =>
  book.language ? { isoCode: book.language.isoCode, name: book.language.name } : null;

// Campos comuns às respostas de detalhe/atualização
function toBookBaseResponse(book: Book) {
  return {
    ISBN: book.ISBN,
    workID: book.workID,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    authors: book.authors.map(toAuthorRef),
    publisher: toPublisherRef(book),
    cover: book.cover,
    edition: book.edition,
    language: toLanguageRef(book),
    numberOfPages: book.numberOfPages,
  };
}

export function toBookDetailsResponse(book: Book, categoryTree: DeweyCategory[] | null) {
  return {
    ...toBookBaseResponse(book),
    categoryTree: categoryTree?.map(category => ({
      ID: category.ID,
      name: category.name,
      decimal: category.decimal,
      level: category.level,
    })),
    numberOfVisits: book.numberOfVisits,
    createdAt: book.createdAt,
  };
}

export function toUpdatedBookResponse(book: Book) {
  return {
    ...toBookBaseResponse(book),
    publishedAt: book.publishedAt,
  };
}

export function toBookSearchResponse(book: Book) {
  return {
    ISBN: book.ISBN,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors.map(toAuthorRef),
    publisher: toPublisherRef(book),
    cover: book.cover,
    numberOfPages: book.numberOfPages,
    numberOfVisits: book.numberOfVisits,
  };
}

export function toCatalogResponse(catalog: Record<string, Book[]>) {
  const view: Record<string, unknown[]> = {};

  for (const genre in catalog) {
    view[genre] = catalog[genre].map(book => ({
      ISBN: book.ISBN,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors,
      cover: book.cover,
    }));
  }

  return view;
}

export function toListedBookResponse({ publishedAt, ...book }: BookSummary) {
  return { ...book, publisher: null };
}

export function toPageResponse<T, R>(
  result: PaginatedResult<T>,
  { limit, offset }: { limit: number; offset: number },
  mapItem: (item: T) => R,
) {
  return {
    books: result.items.map(mapItem),
    total: result.total,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(result.total / limit),
  };
}

export function toBookItemResponse(item: BookItem) {
  return {
    ID: item.ID,
    isbn: item.ISBN,
    status: item.status,
    createdAt: item.createdAt,
  };
}
