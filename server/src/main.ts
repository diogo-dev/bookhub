import "dotenv/config";
import z from "zod";
import cors from "cors";
import express, { Request, Response } from "express";
import { client } from "./infra/pg/connection";

import { Author } from "./domain/Author";
import { Publisher } from "./domain/Publisher";
import { Book } from "./domain/Book";
import { BookItem } from "./domain/BookItem";
import { DeweyCategory } from "./domain/DeweyCategory";
import { Language } from "./domain/Language";

import { AuthorRepositoryPostgresImpl } from "./repositories/impl/postgres/AuthorRepositoryPostgresImpl";
import { PublisherRepositoryPostgresImpl } from "./repositories/impl/postgres/PublisherRepositoryPostgresImpl";
import { BookRepositoryPostgresImpl } from "./repositories/impl/postgres/BookRepositoryPostgresImpl";
import { ItemRepositoryPostgresImpl } from "./repositories/impl/postgres/ItemRepositoryPostgresImpl";
import { CategoryRepositoryPostgresImpl } from "./repositories/impl/postgres/CategoryRepositoryPostgresImpl";
import { LanguageRepositoryPostgresImpl } from "./repositories/impl/postgres/LanguageRepositoryPostgresImpl";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (request: Request, response: Response) => {
  response.json({ message: "root endpoint" });
});

const authorRepository = new AuthorRepositoryPostgresImpl(client);
const publisherRepository = new PublisherRepositoryPostgresImpl(client);
const bookRepository = new BookRepositoryPostgresImpl(client);
const itemRepository = new ItemRepositoryPostgresImpl(client);
const categoryRepository = new CategoryRepositoryPostgresImpl(client);
const languageRepository = new LanguageRepositoryPostgresImpl(client);

const bcp47Pattern = /^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-[a-zA-Z]{2}|\d{3})?$/;
app.get("/languages/:iso_code", async (request: Request, response: Response) => {
  const schema = z.object({
    iso_code: z.string().min(2).max(35).regex(bcp47Pattern)
  });

  const params = schema.parse(request.params);

  const language = await languageRepository.find(params.iso_code);

  if (!language) throw new HttpError(404, "language not found");

  response.json(language);
});

app.post("/languages", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    isoCode: z.string().min(2).max(35).regex(bcp47Pattern),
    name: z.string()
  });

  const params = schema.parse(request.body);

  const language = new Language();
  language.isoCode = params.isoCode;
  language.name = params.name;

  await languageRepository.save(language);

  response.status(201).json(language);
});

app.get("/authors/:id", async (request: Request, response: Response) => {
  const schema = z.object({
    id: z.uuid()
  });

  const params = schema.parse(request.params);

  const author = await authorRepository.find(params.id);

  if (!author) throw new HttpError(404, "author not found");

  response.json(author);
});

app.post("/authors", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    name: z.string(),
    biography: z.string(),
    birthDate: z.coerce.date(),
    deathDate: z.coerce.date().optional(),
  });

  const params = schema.parse(request.body);

  const author = new Author();
  author.name = params.name;
  author.biography = params.biography;
  author.birthDate = params.birthDate;
  author.deathDate = params.deathDate || null;

  await authorRepository.save(author);

  response.status(201).json(author);
});

app.get("/publishers/:id", async (request: Request, response: Response) => {
  const schema = z.object({
    id: z.uuid()
  });

  const params = schema.parse(request.params);

  const publisher = await publisherRepository.find(params.id);

  if (!publisher) throw new HttpError(404, "publisher not found");

  response.json(publisher);
});

app.post("/publishers", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({ name: z.string() });
  const params = schema.parse(request.body);

  const publisher = new Publisher();
  publisher.name = params.name;

  await publisherRepository.save(publisher);

  response.status(201).json(publisher);
});

app.get("/categories/:id", async (request: Request, response: Response) => {
  const schema = z.object({
    id: z.uuid()
  });

  const params = schema.parse(request.params);

  const categoryTree = await categoryRepository.findHierarchy(params.id);
  response.json(categoryTree);
});

app.post("/categories", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    parentID: z.uuid().optional(),
    decimal: z.string(),
    name: z.string(),
    description: z.string().optional()
  });

  const params = schema.parse(request.body);

  if (params.parentID) {
    const parentCategory = await categoryRepository.find(params.parentID);
    if (!parentCategory) throw new HttpError(400, "parent category not found");
  }

  const category = new DeweyCategory();
  category.parentID = params.parentID || null;
  category.decimal = params.decimal;
  category.name = params.name;
  category.description = params.description || "";

  await categoryRepository.save(category);

  response.status(201).json(category);
});

app.get("/books/:isbn", async (request: Request, response: Response) => {
  const schema = z.object({
    isbn: z.string().max(13).regex(/^\d+$/)
  });

  const params = schema.parse(request.params);

  const book = await bookRepository.find(params.isbn);
  if (!book) throw new HttpError(404, "book not found");

  const categoryTree = await categoryRepository.findHierarchy(book.category.ID);

  response.json({ ...book, category: categoryTree });
});

app.post("/books", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    ISBN: z.string().max(13).regex(/^\d+$/),
    parentISBN: z.string().max(13).regex(/^\d+$/).optional(),
    categoryID: z.uuid(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    cover: z.string().optional(),
    authorIDs: z.array(z.uuid()).min(1),
    publisherID: z.uuid(),
    edition: z.string().optional(),
    languageCode: z.string().min(2).max(35).regex(bcp47Pattern),
    numberOfPages: z.coerce.number().min(1),
    publishedAt: z.coerce.date()
  });

  const params = schema.parse(request.body);

  const bookRecord = await bookRepository.find(params.ISBN);
  if (bookRecord) throw new HttpError(400, "ISBN already registered");

  if (params.parentISBN) {
    const parentBook = await bookRepository.find(params.parentISBN);
    if (!parentBook) throw new HttpError(400, "parent book not found");
  }

  const category = await categoryRepository.find(params.categoryID);
  if (!category) throw new HttpError(400, "category not found");

  const queries: Promise<Author>[] = [];
  for (const authorID of params.authorIDs) {
    queries.push(
      authorRepository.find(authorID).then(author => {
        if (author) return author;
        else throw new HttpError(400, "author not found: " + authorID);
      })
    );
  }

  const authors = await Promise.all(queries);

  const publisher = await publisherRepository.find(params.publisherID);
  if (!publisher) throw new HttpError(400, "publisher not found");

  const language = await languageRepository.find(params.languageCode);
  if (!language) throw new HttpError(400, "language not found");

  const book = new Book();
  book.ISBN = params.ISBN;
  book.parentISBN = params.parentISBN || null;
  book.category = category;
  book.title = params.title;
  book.subtitle = params.subtitle || "";
  book.description = params.description || "";
  book.authors = authors;
  book.publisher = publisher;
  book.edition = params.edition || "";
  book.language = language;
  book.numberOfPages = params.numberOfPages;
  book.numberOfVisits = 0;
  book.publishedAt = params.publishedAt.getTime();
  book.items = [];

  await bookRepository.save(book);

  response.status(201).json(book);
});

app.get("/books/:isbn/items", async (request: Request, response: Response) => {
  const schema = z.object({
    isbn: z.string().max(13).regex(/^\d+$/)
  });

  const params = schema.parse(request.params);

  const items = await itemRepository.findByISBN(params.isbn);
  response.json(items);
});

app.post("/books/:isbn/items", async (request: Request, response: Response) => {
  const pathSchema = z.object({ isbn: z.string().max(13).regex(/^\d+$/) });
  const querySchema = z.object({ n: z.coerce.number().min(1).default(1) });

  const pathParams = pathSchema.parse(request.params);
  const queryParams = querySchema.parse(request.query);

  const book = await bookRepository.find(pathParams.isbn);
  if (!book) throw new HttpError(400, "book not found");

  const queries: Promise<void>[] = [];
  const items: BookItem[] = [];

  for (let i = 0; i < queryParams.n; i++) {
    const item = new BookItem(pathParams.isbn);
    items.push(item);

    queries.push(itemRepository.save(item));
  }

  await Promise.all(queries);

  response.status(201).json(items);
});

app.use((request: Request, response: Response) => {
  response.status(404).json({ message: "not found" });
});

class HttpError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
  }
}

app.use("/", (error: Error, request: Request, response: Response, next: Function) => {
  let code = 500;
  let message = "internal server error";
  let body: Record<string, string> | undefined = undefined;

  if (error instanceof SyntaxError && 'body' in error) {
    code = 400;
    message = "invalid JSON format in request body";
  }

  if (error instanceof z.ZodError) {
    code = 400;
    message = "validation error";

    body = {};
    for (const issue of error.issues) {
      body[issue.path.join(".")] = issue.message;
    }
  }

  if (error instanceof HttpError) {
    code = error.statusCode;
    message = error.message;
  }

  console.log(error);
  response.status(code).json({ message, body });
});

app.listen(4000, () => console.log("server is running"));
