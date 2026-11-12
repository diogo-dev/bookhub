import 'tsconfig-paths/register';
import "dotenv/config";
import fs from "fs";
import z from "zod";
import cors from "cors";
import https from "https";
import express, { Request, Response } from "express";
import { client } from "./infra/pg/connection";
import "./scripts/refresh_catalog";

import { Author } from "./domain/Author";
import { Publisher } from "./domain/Publisher";
import { Book } from "./domain/Book";
import { BookItem } from "./domain/BookItem";
import { DeweyCategory } from "./domain/DeweyCategory";
import { Language } from "./domain/Language";


import { authenticateJWT, authorizeRoles } from "./auth/middleware";
import { env } from './config/env';
import { HttpError } from './errors/HttpError';
import {
  bookRepository,
  itemRepository,
  authorRepository,
  publisherRepository,
  categoryRepository,
  languageRepository,
} from './container';
import routes from './routes';
import { bcp47Pattern } from './schemas/languageSchemas';

const app = express();
app.use(express.json());
app.use(cors());

app.use(routes);



app.get("/books/stats", async (request: Request, response: Response) => {
  try {
    const totalBooksResult = await client.query("SELECT COUNT(DISTINCT isbn) as total FROM book;");
    const totalGenresResult = await client.query("SELECT COUNT(DISTINCT genre) as total FROM book_genre;");
    const totalAuthorsResult = await client.query("SELECT COUNT(DISTINCT author_id) as total FROM book_author;");
    const totalItemsResult = await client.query("SELECT COUNT(*) as total FROM book_item WHERE status = 'disponivel';");

    response.json({
      totalBooks: parseInt(totalBooksResult.rows[0].total),
      totalGenres: parseInt(totalGenresResult.rows[0].total),
      totalAuthors: parseInt(totalAuthorsResult.rows[0].total),
      availableItems: parseInt(totalItemsResult.rows[0].total)
    });
  } catch (error: any) {
    response.status(500).json({ message: error.message || "Falha ao buscar estatísticas." });
  }
});

app.get("/books", async (request: Request, response: Response) => {
  const catalog = await bookRepository.listCatalog();
  const view: Record<string, any[]> = {};

  for (const genre in catalog) {
    view[genre] = catalog[genre].map(book => ({
      ISBN: book.ISBN,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors,
      cover: book.cover
    }));
  }

  response.json(view);
});

app.get("/books/all", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    const querySchema = z.object({ 
      limit: z.coerce.number().min(1).max(1000).optional().default(20),
      offset: z.coerce.number().min(0).optional().default(0),
      letter: z.string().length(1).optional()
    });

    const queryParams = querySchema.parse(request.query);
    
    let countQuery = `SELECT COUNT(DISTINCT b.isbn) as total FROM book b`;
    let dataQuery = `
      SELECT DISTINCT b.isbn, b.title, b.subtitle, b.cover, b.number_of_pages, b.number_of_visits
      FROM book b
    `;
    const queryParamsArray: any[] = [];
    const countParamsArray: any[] = [];
    
    if (queryParams.letter) {
      const whereClause = ` WHERE UPPER(SUBSTRING(b.title, 1, 1)) = UPPER($1)`;
      countQuery += whereClause;
      dataQuery += whereClause;
      queryParamsArray.push(queryParams.letter);
      countParamsArray.push(queryParams.letter);
      dataQuery += ` ORDER BY b.title LIMIT $2 OFFSET $3;`;
      queryParamsArray.push(queryParams.limit, queryParams.offset);
    } else {
      dataQuery += ` ORDER BY b.title LIMIT $1 OFFSET $2;`;
      queryParamsArray.push(queryParams.limit, queryParams.offset);
    }
    
    const countResult = await client.query(countQuery, countParamsArray);
    const total = parseInt(countResult.rows[0].total);
    
    const result = await client.query(dataQuery, queryParamsArray);

    const booksWithAuthors = await Promise.all(
      result.rows.map(async (row: any) => {
        const authorsResult = await client.query(`
          SELECT a.id, a.name
          FROM book_author ba
          JOIN author a ON ba.author_id = a.id
          WHERE ba.book_isbn = $1;
        `, [row.isbn]);

        return {
          ISBN: row.isbn,
          title: row.title,
          subtitle: row.subtitle,
          authors: authorsResult.rows.map((a: any) => ({ ID: a.id, name: a.name })),
          publisher: null,
          cover: row.cover,
          numberOfPages: row.number_of_pages,
          numberOfVisits: row.number_of_visits
        };
      })
    );

    response.json({
      books: booksWithAuthors,
      total: total,
      page: Math.floor(queryParams.offset / queryParams.limit) + 1,
      totalPages: Math.ceil(total / queryParams.limit)
    });
  } catch (error: any) {
    response.status(400).json({ message: error.message || "Falha ao listar livros." });
  }
});

app.get("/books/search", async (request: Request, response: Response) => {
  try {
    const querySchema = z.object({ 
      q: z.string().min(1),
      limit: z.coerce.number().min(1).max(200).optional().default(50)
    });

    const queryParams = querySchema.parse(request.query);
    
    if (!queryParams.q || queryParams.q.trim().length === 0) {
      return response.status(400).json({ message: "Query de busca é obrigatória" });
    }

    const books = await bookRepository.findByText(queryParams.q.trim(), queryParams.limit);

    response.json(books.map(book => ({
      ISBN: book.ISBN,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors.map(a => ({ ID: a.ID, name: a.name })),
      publisher: book.publisher ? {
        name: book.publisher.name,
        displayName: book.publisher.displayName
      } : null,
      cover: book.cover,
      numberOfPages: book.numberOfPages,
      numberOfVisits: book.numberOfVisits
    })));
  } catch (error: any) {
    console.error("Error in /books/search endpoint:", error);
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: "Query de busca é obrigatória", errors: error.issues });
    }
    response.status(500).json({ message: error.message || "Falha ao buscar livros." });
  }
});

app.get("/books/genre/:genre", async (request: Request, response: Response) => {
  try {
    const querySchema = z.object({ 
      limit: z.coerce.number().min(1).max(200).optional().default(50),
      offset: z.coerce.number().min(0).optional().default(0),
      sortBy: z.enum(['popularity', 'title', 'date', 'pages']).optional().default('popularity'),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
      yearFrom: z.coerce.number().min(1000).max(3000).optional(),
      yearTo: z.coerce.number().min(1000).max(3000).optional()
    });

    const queryParams = querySchema.parse(request.query);
    const genre = request.params.genre;

    const whereConditions: string[] = [`bg.genre LIKE $1`];
    const queryParamsArray: any[] = [`%${genre}%`];
    let paramIndex = 2;

    if (queryParams.yearFrom) {
      const yearFromTimestamp = new Date(queryParams.yearFrom, 0, 1).getTime() / 1000;
      whereConditions.push(`b.published_at >= $${paramIndex}`);
      queryParamsArray.push(yearFromTimestamp);
      paramIndex++;
    }

    if (queryParams.yearTo) {
      const yearToTimestamp = new Date(queryParams.yearTo, 11, 31, 23, 59, 59).getTime() / 1000;
      whereConditions.push(`b.published_at <= $${paramIndex}`);
      queryParamsArray.push(yearToTimestamp);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    let orderBy = '';
    switch (queryParams.sortBy) {
      case 'title':
        orderBy = `b.title ${queryParams.sortOrder.toUpperCase()}`;
        break;
      case 'date':
        orderBy = `b.published_at ${queryParams.sortOrder.toUpperCase()}`;
        break;
      case 'pages':
        orderBy = `b.number_of_pages ${queryParams.sortOrder.toUpperCase()}`;
        break;
      case 'popularity':
      default:
        orderBy = `b.number_of_visits ${queryParams.sortOrder.toUpperCase()}, b.title ASC`;
        break;
    }

    const countQuery = await client.query(`
      SELECT COUNT(DISTINCT b.isbn) as total
      FROM book b
      JOIN book_genre bg ON b.isbn = bg.book_isbn
      WHERE ${whereClause};
    `, queryParamsArray);

    const total = parseInt(countQuery.rows[0].total);

    const booksQuery = await client.query(`
      SELECT DISTINCT b.isbn, b.title, b.subtitle, b.cover, b.number_of_pages, b.number_of_visits, b.published_at
      FROM book b
      JOIN book_genre bg ON b.isbn = bg.book_isbn
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `, [...queryParamsArray, queryParams.limit, queryParams.offset]);

    const booksWithAuthors = await Promise.all(
      booksQuery.rows.map(async (row: any) => {
        const authorsResult = await client.query(`
          SELECT a.id, a.name
          FROM book_author ba
          JOIN author a ON ba.author_id = a.id
          WHERE ba.book_isbn = $1;
        `, [row.isbn]);

        return {
          ISBN: row.isbn,
          title: row.title,
          subtitle: row.subtitle,
          authors: authorsResult.rows.map((a: any) => ({ ID: a.id, name: a.name })),
          cover: row.cover,
          numberOfPages: row.number_of_pages,
          numberOfVisits: row.number_of_visits,
          publishedAt: row.published_at ? Number(row.published_at) : null
        };
      })
    );

    response.json({
      books: booksWithAuthors,
      total: total,
      page: Math.floor(queryParams.offset / queryParams.limit) + 1,
      totalPages: Math.ceil(total / queryParams.limit),
      genre: genre
    });
  } catch (error: any) {
    response.status(400).json({ message: error.message || "Falha ao buscar livros por gênero." });
  }
});

app.get("/books/search/admin", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    const querySchema = z.object({ 
      q: z.string().min(1),
      limit: z.coerce.number().min(1).max(200).optional().default(100)
    });

    const queryParams = querySchema.parse(request.query);
    const books = await bookRepository.findByText(queryParams.q, queryParams.limit);

    response.json(books.map(book => ({
      ISBN: book.ISBN,
      title: book.title,
      subtitle: book.subtitle,
      authors: book.authors.map(a => ({ ID: a.ID, name: a.name })),
      publisher: book.publisher ? {
        name: book.publisher.name,
        displayName: book.publisher.displayName
      } : null,
      cover: book.cover,
      numberOfPages: book.numberOfPages,
      numberOfVisits: book.numberOfVisits
    })));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: "Query de busca é obrigatória" });
    }
    response.status(400).json({ message: error.message || "Falha ao buscar livros." });
  }
});

app.get("/books/:isbn", async (request: Request, response: Response) => {
  try {
    const rawISBN = request.params.isbn;
    const normalizedISBN = rawISBN.replace(/\D/g, '');
    
    if (!normalizedISBN || normalizedISBN.length === 0) {
      throw new HttpError(400, "ISBN inválido");
    }
    
    const schema = z.object({
      isbn: z.string().max(13).regex(/^\d+$/)
    });

    const params = schema.parse({ isbn: normalizedISBN });

    const book = await bookRepository.find(params.isbn);
    if (!book) throw new HttpError(404, "book not found");

    const categoryTree = book.category
      ? await categoryRepository.findHierarchy(book.category.decimal)
      : null;

    return response.json({
    ISBN: book.ISBN,
    workID: book.workID,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    authors: book.authors.map(author => ({
      ID: author.ID,
      name: author.name
    })),
    publisher: book.publisher ? {
      name: book.publisher.name,
      displayName: book.publisher.displayName
    } : null,
    categoryTree: categoryTree?.map(category => ({
      ID: category.ID,
      name: category.name,
      decimal: category.decimal,
      level: category.level
    })),
    cover: book.cover,
    edition: book.edition,
    language: book.language ? {
      isoCode: book.language.isoCode,
      name: book.language.name
    } : null,
    numberOfPages: book.numberOfPages,
    numberOfVisits: book.numberOfVisits,
    createdAt: book.createdAt
  });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return response.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: "ISBN inválido", errors: error.issues });
    }
    return response.status(500).json({ message: error.message || "Erro ao buscar livro" });
  }
});

app.post("/books", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    ISBN: z.string().max(13).regex(/^\d+$/),
    workID: z.string().max(13).regex(/^\d+$/).optional(),
    categoryID: z.uuid().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    cover: z.string().optional(),
    authorIDs: z.array(z.uuid()).min(1),
    publisherName: z.string().optional(),
    edition: z.string().optional(),
    languageCode: z.string().min(2).max(35).regex(bcp47Pattern).optional(),
    numberOfPages: z.coerce.number().min(1),
    publishedAt: z.coerce.date().optional()
  });

  const params = schema.parse(request.body);

  const bookRecord = await bookRepository.find(params.ISBN);
  if (bookRecord) throw new HttpError(400, "ISBN already registered");

  if (params.workID) {
    const work = await bookRepository.find(params.workID);
    if (!work) throw new HttpError(400, "related work not found");
  }

  let category: DeweyCategory | null = null;
  if (params.categoryID) {
    category = await categoryRepository.find(params.categoryID);
    if (!category) throw new HttpError(400, "category not found");
  }

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

  let publisher: Publisher | null = null;
  if (params.publisherName) {
    publisher = await publisherRepository.find(params.publisherName);
    if (!publisher) throw new HttpError(400, "publisher not found");
  }

  let language: Language | null = null;
  if (params.languageCode) {
    language = await languageRepository.find(params.languageCode);
    if (!language) throw new HttpError(400, "language not found");
  }

  const book = new Book();
  book.ISBN = params.ISBN;
  book.workID = params.workID || null;
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
  book.publishedAt = params.publishedAt ? params.publishedAt.getTime() : null;
  book.items = [];

  await bookRepository.save(book);

  response.status(201).json(book);
});

app.get("/books/:isbn/items", async (request: Request, response: Response) => {
  const rawISBN = request.params.isbn;
  const normalizedISBN = rawISBN.replace(/\D/g, '');
  
  const schema = z.object({
    isbn: z.string().max(13).regex(/^\d+$/)
  });

  const params = schema.parse({ isbn: normalizedISBN });

  const items = await itemRepository.findByISBN(params.isbn);
  response.json(items.map(item => ({
    ID: item.ID,
    isbn: item.ISBN,
    status: item.status,
    createdAt: item.createdAt
  })));
});

app.post("/books/:isbn/items", async (request: Request, response: Response) => {
  const rawISBN = request.params.isbn;
  const normalizedISBN = rawISBN.replace(/\D/g, '');
  
  const pathSchema = z.object({ isbn: z.string().max(13).regex(/^\d+$/) });
  const querySchema = z.object({ n: z.coerce.number().min(1).default(1) });

  const pathParams = pathSchema.parse({ isbn: normalizedISBN });
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

  response.status(201).json(items.map(item => ({
    ID: item.ID,
    isbn: item.ISBN,
    status: item.status,
    createdAt: item.createdAt
  })));
});


app.patch("/books/:isbn", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const rawISBN = request.params.isbn;
  const normalizedISBN = rawISBN.replace(/\D/g, '');
  
  const pathSchema = z.object({ isbn: z.string().max(13).regex(/^\d+$/) });
  const pathParams = pathSchema.parse({ isbn: normalizedISBN });

  const book = await bookRepository.find(pathParams.isbn);
  if (!book) throw new HttpError(404, "book not found");

  const schema = z.object({
    workID: z.string().max(13).regex(/^\d+$/).optional(),
    categoryID: z.uuid().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    cover: z.string().optional(),
    authorIDs: z.array(z.uuid()).min(1).optional(),
    publisherName: z.string().optional(),
    edition: z.string().optional(),
    languageCode: z.string().min(2).max(35).regex(bcp47Pattern).optional(),
    numberOfPages: z.coerce.number().min(1).optional(),
    publishedAt: z.coerce.date().optional()
  });

  const params = schema.parse(request.body);

  if (params.workID !== undefined) {
    if (params.workID) {
      const work = await bookRepository.find(params.workID);
      if (!work) throw new HttpError(400, "related work not found");
    }
    book.workID = params.workID || null;
  }

  if (params.categoryID !== undefined) {
    if (params.categoryID) {
      const category = await categoryRepository.find(params.categoryID);
      if (!category) throw new HttpError(400, "category not found");
      book.category = category;
    } else {
      book.category = null;
    }
  }

  if (params.title !== undefined) book.title = params.title;
  if (params.subtitle !== undefined) book.subtitle = params.subtitle || "";
  if (params.description !== undefined) book.description = params.description || "";
  if (params.cover !== undefined) book.cover = params.cover || null;

  if (params.authorIDs !== undefined) {
    const queries: Promise<Author>[] = [];
    for (const authorID of params.authorIDs) {
      queries.push(
        authorRepository.find(authorID).then(author => {
          if (author) return author;
          else throw new HttpError(400, "author not found: " + authorID);
        })
      );
    }
    book.authors = await Promise.all(queries);
  }

  if (params.publisherName !== undefined) {
    if (params.publisherName) {
      const publisher = await publisherRepository.find(params.publisherName);
      if (!publisher) throw new HttpError(400, "publisher not found");
      book.publisher = publisher;
    } else {
      book.publisher = null;
    }
  }

  if (params.edition !== undefined) book.edition = params.edition || "";
  if (params.numberOfPages !== undefined) book.numberOfPages = params.numberOfPages;

  if (params.languageCode !== undefined) {
    if (params.languageCode) {
      const language = await languageRepository.find(params.languageCode);
      if (!language) throw new HttpError(400, "language not found");
      book.language = language;
    } else {
      book.language = null;
    }
  }

  if (params.publishedAt !== undefined) {
    book.publishedAt = params.publishedAt ? params.publishedAt.getTime() : null;
  }

  await bookRepository.save(book);

  response.json({
    ISBN: book.ISBN,
    workID: book.workID,
    title: book.title,
    subtitle: book.subtitle,
    description: book.description,
    authors: book.authors.map(author => ({
      ID: author.ID,
      name: author.name
    })),
    publisher: book.publisher ? {
      name: book.publisher.name,
      displayName: book.publisher.displayName
    } : null,
    cover: book.cover,
    edition: book.edition,
    language: book.language ? {
      isoCode: book.language.isoCode,
      name: book.language.name
    } : null,
    numberOfPages: book.numberOfPages,
    publishedAt: book.publishedAt
  });
});

app.delete("/books/:isbn", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  const rawISBN = request.params.isbn;
  const normalizedISBN = rawISBN.replace(/\D/g, '');
  
  const schema = z.object({
    isbn: z.string().max(13).regex(/^\d+$/)
  });

  const params = schema.parse({ isbn: normalizedISBN });

  const book = await bookRepository.find(params.isbn);
  if (!book) throw new HttpError(404, "book not found");

  await bookRepository.delete(params.isbn);

  response.status(200).json({ message: "Book deleted successfully" });
});

app.use((request: Request, response: Response) => {
  response.status(404).json({ message: "not found" });
});

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

const PORT = env.PORT || 4000;

if (env.NODE_ENV == "production") {
  const options = {
    key: fs.readFileSync(env.HTTPS_KEY_PATH || "key.pem"),
    cert: fs.readFileSync(env.HTTPS_CERT_PATH || "cert.pem")
  }

  https
    .createServer(options, app)
    .listen(PORT, () => console.log(`server is running on port ${PORT}`));
} else app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
