import { Request, Response } from "express";
import { BookService } from "@/services/BookService";
import {
  toBookDetailsResponse,
  toBookItemResponse,
  toBookSearchResponse,
  toCatalogResponse,
  toListedBookResponse,
  toPageResponse,
  toUpdatedBookResponse,
} from "@/mappers/bookMapper";
import {
  addItemsQuerySchema,
  adminSearchBooksQuerySchema,
  createBookSchema,
  genreParamsSchema,
  isbnParamsSchema,
  listBooksByGenreQuerySchema,
  listBooksQuerySchema,
  searchBooksQuerySchema,
  updateBookSchema,
} from "@/schemas/bookSchemas";

export class BookController {
  constructor(private bookService: BookService) {}

  catalog = async (_req: Request, res: Response) => {
    const catalog = await this.bookService.getCatalog();

    res.status(200).json(toCatalogResponse(catalog));
  };

  stats = async (_req: Request, res: Response) => {
    const stats = await this.bookService.getStats();

    res.status(200).json(stats);
  };

  list = async (req: Request, res: Response) => {
    const query = listBooksQuerySchema.parse(req.query);
    const result = await this.bookService.listPaginated(query);

    res.status(200).json(toPageResponse(result, query, toListedBookResponse));
  };

  search = async (req: Request, res: Response) => {
    const { q, limit } = searchBooksQuerySchema.parse(req.query);
    const books = await this.bookService.search(q, limit);

    res.status(200).json(books.map(toBookSearchResponse));
  };

  adminSearch = async (req: Request, res: Response) => {
    const { q, limit } = adminSearchBooksQuerySchema.parse(req.query);
    const books = await this.bookService.search(q, limit);

    res.status(200).json(books.map(toBookSearchResponse));
  };

  listByGenre = async (req: Request, res: Response) => {
    const { genre } = genreParamsSchema.parse(req.params);
    const query = listBooksByGenreQuerySchema.parse(req.query);
    const result = await this.bookService.listByGenre(genre, query);

    res.status(200).json({ ...toPageResponse(result, query, book => book), genre });
  };

  show = async (req: Request, res: Response) => {
    const { isbn } = isbnParamsSchema.parse(req.params);
    const { book, categoryTree } = await this.bookService.getDetails(isbn);

    res.status(200).json(toBookDetailsResponse(book, categoryTree));
  };

  create = async (req: Request, res: Response) => {
    const data = createBookSchema.parse(req.body);
    const book = await this.bookService.create(data);

    res.status(201).json(book);
  };

  update = async (req: Request, res: Response) => {
    const { isbn } = isbnParamsSchema.parse(req.params);
    const data = updateBookSchema.parse(req.body);
    const book = await this.bookService.update(isbn, data);

    res.status(200).json(toUpdatedBookResponse(book));
  };

  remove = async (req: Request, res: Response) => {
    const { isbn } = isbnParamsSchema.parse(req.params);
    await this.bookService.delete(isbn);

    res.status(200).json({ message: "Book deleted successfully" });
  };

  listItems = async (req: Request, res: Response) => {
    const { isbn } = isbnParamsSchema.parse(req.params);
    const items = await this.bookService.listItems(isbn);

    res.status(200).json(items.map(toBookItemResponse));
  };

  addItems = async (req: Request, res: Response) => {
    const { isbn } = isbnParamsSchema.parse(req.params);
    const { n } = addItemsQuerySchema.parse(req.query);
    const items = await this.bookService.addItems(isbn, n);

    res.status(201).json(items.map(toBookItemResponse));
  };
}
