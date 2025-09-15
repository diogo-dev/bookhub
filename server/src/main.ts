import "dotenv/config";
import z from "zod";
import cors from "cors";
import express, { Request, Response } from "express";
import { client } from "./infra/pg/connection";

import { Author } from "./domain/Author";
import { Publisher } from "./domain/Publisher";
import { Address } from "./domain/Address";
import { Book } from "./domain/Book";
import { BookItem } from "./domain/BookItem";
import { DeweyCategory } from "./domain/DeweyCategory";
import { Language } from "./domain/Language";

import { AuthorRepositoryPostgresImpl } from "./repositories/impl/postgres/AuthorRepositoryPostgresImpl";
import { PublisherRepositoryPostgresImpl } from "./repositories/impl/postgres/PublisherRepositoryPostgresImpl";
import { AddressRepositoryPostgresImpl } from "./repositories/impl/postgres/AddressRepositoryPostgresImpl";
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
const addressRepository = new AddressRepositoryPostgresImpl(client);
const bookRepository = new BookRepositoryPostgresImpl(client);
const itemRepository = new ItemRepositoryPostgresImpl(client);
const categoryRepository = new CategoryRepositoryPostgresImpl(client);
const languageRepository = new LanguageRepositoryPostgresImpl(client);

app.get("/addresses/:id", async (request: Request, response: Response) => {
  const addressID = z.uuid().parse(request.params.id);

  const address = await addressRepository.find(addressID);

  if (!address) throw new HttpError(404, "address not found");

  response.json(address);
});

app.post("/addresses", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    postalCode: z.string().max(15),
    placeName: z.string(),
    streetName: z.string(),
    streetNumber: z.coerce.number(),
    complement: z.string(),
    neighborhood: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string()
  });

  const params = schema.parse(request.body);

  const address = new Address();
  address.postalCode = params.postalCode;
  address.placeName = params.placeName;
  address.streetName = params.streetName;
  address.streetNumber = params.streetNumber;
  address.complement = params.complement;
  address.neighborhood = params.neighborhood;
  address.city = params.city;
  address.state = params.state;
  address.country = params.country;

  await addressRepository.save(address);

  response.status(201).json(address);
});

const bcp47Pattern = /^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-[a-zA-Z]{2}|\d{3})?$/;
app.get("/languages/:iso_code", async (request: Request, response: Response) => {
  const isoCode = z.string().min(2).max(35).regex(bcp47Pattern).parse(request.params.iso_code);

  const language = await languageRepository.find(isoCode);

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
  const authorID = z.uuid().parse(request.params.id);

  const author = await authorRepository.find(authorID);

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
  const publisherID = z.uuid().parse(request.params.id);

  const publisher = await publisherRepository.find(publisherID);

  if (!publisher) throw new HttpError(404, "publisher not found");

  response.json(publisher);
});

app.post("/publishers", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    name: z.string(),
    addressID: z.uuid()
  });

  const params = schema.parse(request.body);

  const address = await addressRepository.find(params.addressID);
  if (!address) throw new HttpError(400, "address not found");

  const publisher = new Publisher();
  publisher.name = params.name;
  publisher.address = address;

  await publisherRepository.save(publisher);

  response.status(201).json(publisher);
});

app.get("/categories/:id", async (request: Request, response: Response) => {
  const categoryID = z.uuid().parse(request.params.id);

  const category = await categoryRepository.find(categoryID);

  if (!category) throw new HttpError(404, "category not found");

  response.json(category);
});

app.post("/categories", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    parentID: z.uuid().optional(),
    decimal: z.coerce.number(),
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
  const bookISBN = z.string().max(13).regex(/^\d+$/).parse(request.params.isbn);

  const book = await bookRepository.find(bookISBN);

  if (!book) throw new HttpError(404, "book not found");

  response.json(book);
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
    authorIDs: z.array(z.uuid()).min(1),
    publisherIDs: z.array(z.uuid()).min(1),
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

  const authorQueries: Promise<Author>[] = [];
  const publisherQueries: Promise<Publisher>[] = [];

  for (const authorID of params.authorIDs) {
    authorQueries.push(
      authorRepository.find(authorID).then(author => {
        if (author) return author;
        else throw new HttpError(400, "author not found: " + authorID);
      })
    );
  }

  for (const publisherID of params.publisherIDs) {
   publisherQueries.push(
      publisherRepository.find(publisherID).then(publisher => {
        if (publisher) return publisher;
        else throw new HttpError(400, "publisher not found: " + publisherID);
      })
    );
  }

  const authors = await Promise.all(authorQueries);
  const publishers = await Promise.all(publisherQueries);

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
  book.publishers = publishers;
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
  const ISBN = z.string().max(13).regex(/^\d+$/).parse(request.params.isbn);

  const items = await itemRepository.findByISBN(ISBN);
  response.json(items);
});

app.post("/books/:isbn/items", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    ISBN: z.string().max(13).regex(/^\d+$/),
    quantity: z.coerce.number().min(1)
  });

  const params = schema.parse(request.body);

  const book = await bookRepository.find(params.ISBN);
  if (!book) throw new HttpError(400, "book not found");

  const queries: Promise<any>[] = [];

  for (let i = 0; i < params.quantity; i++) {
    const item = new BookItem(params.ISBN);
    queries.push(itemRepository.save(item));
  }

  const items = await Promise.all(queries);

  response.status(201).json(items);
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

  if (error instanceof z.ZodError) {
    code = 400;
    message = "validation error";
  }

  if (error instanceof HttpError) {
    code = error.statusCode;
    message = error.message;
  }

  response.status(code).json({ message });
});


app.listen(4000, () => console.log("server is running"));
