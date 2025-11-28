import "dotenv/config";
import z from "zod";
import cors from "cors";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { client } from "./infra/pg/connection";
import "./scripts/refresh_catalog";

import { Account } from "./domain/Account";
import { Author } from "./domain/Author";
import { Publisher } from "./domain/Publisher";
import { Book } from "./domain/Book";
import { BookItem } from "./domain/BookItem";
import { DeweyCategory } from "./domain/DeweyCategory";
import { Language } from "./domain/Language";
import { Permission } from "./domain/Permission";
import { Role } from "./domain/Role";

import { AccountRepositoryPostgresImpl } from "./repositories/impl/postgres/AccountRepositoryPostgresImpl";
import { AuthorRepositoryPostgresImpl } from "./repositories/impl/postgres/AuthorRepositoryPostgresImpl";
import { PublisherRepositoryPostgresImpl } from "./repositories/impl/postgres/PublisherRepositoryPostgresImpl";
import { BookRepositoryPostgresImpl } from "./repositories/impl/postgres/BookRepositoryPostgresImpl";
import { ItemRepositoryPostgresImpl } from "./repositories/impl/postgres/ItemRepositoryPostgresImpl";
import { CategoryRepositoryPostgresImpl } from "./repositories/impl/postgres/CategoryRepositoryPostgresImpl";
import { LanguageRepositoryPostgresImpl } from "./repositories/impl/postgres/LanguageRepositoryPostgresImpl";
import { PermissionRepositoryPostgresImpl } from "./repositories/impl/postgres/PermissionRepositoryPostgresImpl";
import { RoleRepositoryPostgresImpl } from "./repositories/impl/postgres/RoleRepositoryPostgresImpl";
import { UsersRepositoryPosgresImpl } from "./repositories/impl/postgres/UsersRepositoryPosgresImpl";
import { InterestRepositoryPostgresImpl } from "./repositories/impl/postgres/InterestRepositoryPostgresImpl";
import { InterestService } from "./services/InterestService";
import { LoanService } from "./services/LoanService";
import { LoanRepositoryPostgresImpl } from "./repositories/impl/postgres/LoanRepositoryPostgresImpl";
import { ReservationRepositoryPostgresImpl } from "./repositories/impl/postgres/ReservationRepositoryPostgresImpl";

import { AuthRequest } from "./dto/AuthRequest";

import { AuthService } from "./auth/auth.service";
import { ProfileService } from "./services/ProfileService";
import { authenticateJWT } from "./auth/middleware";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (request: Request, response: Response) => {
  response.json({ message: "root endpoint" });
});

const accountRepository = new AccountRepositoryPostgresImpl(client);
const authorRepository = new AuthorRepositoryPostgresImpl(client);
const publisherRepository = new PublisherRepositoryPostgresImpl(client);
const bookRepository = new BookRepositoryPostgresImpl(client);
const itemRepository = new ItemRepositoryPostgresImpl(client);
const categoryRepository = new CategoryRepositoryPostgresImpl(client);
const languageRepository = new LanguageRepositoryPostgresImpl(client);
const roleRepository = new RoleRepositoryPostgresImpl(client);
const permissionRepository = new PermissionRepositoryPostgresImpl(client);
const usersRepository = new UsersRepositoryPosgresImpl(client);
const loanRepository = new LoanRepositoryPostgresImpl(client);
const reservationRepository = new ReservationRepositoryPostgresImpl(client);

const authService = new AuthService(usersRepository, roleRepository);
const profileService = new ProfileService(usersRepository);
const interestRepository = new InterestRepositoryPostgresImpl(client);
const interestService = new InterestService(interestRepository, bookRepository);
const loanService = new LoanService(loanRepository, reservationRepository, itemRepository, client);

app.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string()
    });
    
    const params = schema.parse(req.body);

    const { email, password } = params;

    const result = await authService.login({ email, password });

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    return res.status(401).json({ message: error.message || "Falha ao realizar login." });
  }
});

app.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      cpf: z.string().min(11).max(14),
      password: z.string(),
      roleName: z.string().optional()
    });

    const params = schema.parse(req.body);

    const { name, email, cpf, password, roleName } = params;

    const result = await authService.register({ name, email, cpf, password, roleName });

    return res.status(201).json({
      message: "Usuário registrado com sucesso!",
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    return res.status(400).json({ 
      message: error.message || "Erro ao registrar usuário." 
    });
  }
});

app.get("/reservations/users/:cpf", authenticateJWT, async (req: Request, res: Response) => {
  try {
      const schema = z.object({
      cpf: z.string().min(11).max(14)
    });

    const params = schema.parse(req.params);
    const user = await usersRepository.findByCpf(params.cpf);
    if (!user) throw new HttpError(404, "user not found");

    const reservations = await reservationRepository.findReservationListByUser(user.ID)
    if (!reservations) throw new HttpError(404, "reservations not found");

    return res.status(200).json({
      user,
      reservations
    })
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Erro ao registar usuário"
    });
  }
})

app.get("/users:id", async (request: Request, response: Response) => {
 const schema = z.object({
    id: z.uuid()
  });

  const params = schema.parse(request.params);

  const user = await usersRepository.findById(params.id);

  if (!user) throw new HttpError(404, "user not found");

  response.json(user);
})

app.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => { 

  try { 
    const userId = req.user!.sub;
    const user = await profileService.getProfile(userId);

    return res.status(200).json({
      id: user.ID,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      roles: user.roles.map(r => r.name),
      createdAt: user.createdAt
    });
  } catch (error: any) {
    return res.status(401).json({ message: error.message || "Falha ao buscar perfil do usuário." });
  }
});

app.patch('/me', authenticateJWT, async (req: AuthRequest, res: Response) => { 
  try { 
    const schema = z.object({
      name: z.string().optional(),
      email: z.email().optional(),
      password: z.string().optional()
    });

    const params = schema.parse(req.body);
    const userId = req.user!.sub;

    const updateUser = await profileService.updateProfile(userId, params);

    return res.status(200).json({
      id: updateUser.ID,
      name: updateUser.name,
      email: updateUser.email,
      cpf: updateUser.cpf,
      roles: updateUser.roles.map(r => r.name),
      createdAt: updateUser.createdAt
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Erro de validação", errors: error.issues });
    }

    return res.status(400).json({ message: error.message || "Falha ao atualizar perfil do usuário." });
  }
});

app.delete('/me', authenticateJWT, async (req: AuthRequest, res: Response) => { 
  try { 
    const userId = req.user!.sub;
    await profileService.deleteAccount(userId);

    return res.status(200).json({ message: "Conta deletada com sucesso." });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao deletar conta." });
  }
});

app.get("/me/interests", authenticateJWT, async (req: AuthRequest, res: Response) => { 
  try { 
    const userId = req.user!.sub;
    const interests = await interestService.getUserInterests(userId);
    return res.status(200).json(interests);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao buscar interesses do usuário." });
  }
});

app.post("/me/interests", authenticateJWT, async (req: AuthRequest, res: Response) => { 
  try { 
    const schema = z.object({
      bookISBN: z.string().max(13).regex(/^\d+$/)
    });

    const params = schema.parse(req.body);
    const userId = req.user!.sub;

    const interest = await interestService.addInterest(userId, params.bookISBN);

    return res.status(201).json(interest);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Erro de validação", errors: error.issues });
    }
    return res.status(400).json({ message: error.message || "Falha ao adicionar interesse." });
  }
});

app.delete("/me/interests/:isbn", authenticateJWT, async (req: AuthRequest, res: Response) => { 
  try { 
    const schema = z.object({
      isbn: z.string().max(13).regex(/^\d+$/)
    });

    const params = schema.parse(req.params);
    const userId = req.user!.sub;

    await interestService.removeInterest(userId, params.isbn);
    return res.status(200).json({ message: "Interesse removido com sucesso." });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao remover interesse." });
  }
});

app.get("/me/loans", authenticateJWT, async(req: AuthRequest, res: Response) => { 
  try { 
    const userId = req.user!.sub;
    const loans = await loanService.getUserLoans(userId);
    return res.status(200).json(loans);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao buscar empréstimos do usuário." });
  }
});

app.post("/reservations", authenticateJWT, async(req: AuthRequest, res: Response) => { 

  try { 
    const schema = z.object({
      itemID: z.uuid(),
      startAt: z.coerce.number(),
      endAt: z.coerce.number()
    });

    const params = schema.parse(req.body);
    const userId = req.user!.sub;

    const reservation = await loanService.createReservation(userId, params.itemID, params.startAt, params.endAt);
    return res.status(201).json(reservation);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.issues });
    }
    return res.status(400).json({ message: error.message || "Falha ao criar reserva." });
  }
});

app.post("/loans", authenticateJWT, async(req: AuthRequest, res: Response) => { 
  try { 
    const schema = z.object({
      itemID: z.uuid(),
      startAt: z.coerce.number(),
      dueAt: z.coerce.number(),
      reservationID: z.uuid().optional()
    });

    const params = schema.parse(req.body);
    const userId = req.user!.sub;

    const loan = await loanService.createLoan(userId, params.itemID, params.startAt, params.dueAt, params.reservationID);

    return res.status(201).json(loan);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.issues });
    }
    return res.status(400).json({ message: error.message || "Falha ao criar empréstimo." });
  }
});

app.patch("/loans/:id/return", authenticateJWT, async(req: AuthRequest, res: Response) => { 
  try { 
    const schema = z.object({
      id: z.uuid()
    });

    const params = schema.parse(req.params);
    const userId = req.user!.sub;
    
    // Buscar empréstimo primeiro para validar propriedade
    const loan = await loanRepository.findById(params.id);
    if (!loan) {
      return res.status(404).json({ message: "Empréstimo não encontrado" });
    }
    
    // Validar se o empréstimo pertence ao usuário autenticado
    if (loan.userID !== userId) {
      return res.status(403).json({ message: "Acesso negado: empréstimo não pertence ao usuário" });
    }
    
    // Agora sim, devolver o empréstimo
    const returnedLoan = await loanService.returnLoan(params.id);

    return res.status(200).json({
      message: "Empréstimo devolvido com sucesso.",
      loan: returnedLoan
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.issues });
    }
    return res.status(400).json({ message: error.message || "Falha ao devolver empréstimo." });
  }
});

app.get("/permissions/:id", async (request: Request, response: Response) => {
 const schema = z.object({
    id: z.uuid()
  });

  const params = schema.parse(request.params);

  const user = await permissionRepository.find(params.id);

  if (!user) throw new HttpError(404, "permission not found");

  response.json(user);
})

app.post("/permissions", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({ name: z.string() });

  const params = schema.parse(request.body);

  const permission = await permissionRepository.findByName(params.name);
  if (permission) throw new HttpError(400, "permission name already registered");

  const newPermission = new Permission(params.name);

  await permissionRepository.save(newPermission);

  response.status(201).json(newPermission);
});

app.get("/roles/:id", async (request: Request, response: Response) => {
 const schema = z.object({
    id: z.uuid()
  });

  const params = schema.parse(request.params);

  const user = await roleRepository.find(params.id);

  if (!user) throw new HttpError(404, "permission not found");

  response.json(user);
})

app.post("/roles", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({
    name: z.string(),
    permissionNames: z.array(z.string()).optional()
  });

  const params = schema.parse(request.body);

  const existingRole = await roleRepository.getRoleByName(params.name);
  if (existingRole) throw new HttpError(400, "role name already registered");

  let permissions: Permission[] = [];
  if (params.permissionNames && params.permissionNames.length > 0) {
    permissions = await Promise.all(
      params.permissionNames.map(async (permName) => {
        const permission = await permissionRepository.findByName(permName);
        if (!permission) throw new HttpError(404, `Permission '${permName}' not found`);
        return permission;
      })
    );
  }

  const newRole = new Role(params.name, permissions);

  await roleRepository.save(newRole);

  response.status(201).json(newRole);
});


app.post("/accounts/register", async (request: Request, response: Response) => {
  const schema = z.object({
    email: z.email(),
    password: z.string()
  });

  const params = schema.parse(request.params);

  const accountExists = await accountRepository.findByEmail(params.email);
  if (accountExists) throw new HttpError(400, "email already used");

  const account = new Account();
  account.email = params.email;

  const saltRounds = 10;
  account.password_hash = await bcrypt.hash(params.password, saltRounds);

  await accountRepository.save(account);

  response.status(201).json(account);
})

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

app.get("/publishers/:name", async (request: Request, response: Response) => {
  const schema = z.object({
    name: z.string()
  });

  const params = schema.parse(request.params);

  const publisher = await publisherRepository.find(params.name);

  if (!publisher) throw new HttpError(404, "publisher not found");

  response.json(publisher);
});

app.post("/publishers", async (request: Request, response: Response) => {
  if (!request.body) throw new HttpError(400, "body is required");

  const schema = z.object({ displayName: z.string() });
  const params = schema.parse(request.body);

  const publisher = new Publisher();
  publisher.displayName = params.displayName;

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

  await categoryRepository.save(category);

  response.status(201).json(category);
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

app.get("/books/:isbn", async (request: Request, response: Response) => {
  const schema = z.object({
    isbn: z.string().max(13).regex(/^\d+$/)
  });

  const params = schema.parse(request.params);

  const book = await bookRepository.find(params.isbn);
  if (!book) throw new HttpError(404, "book not found");

  const categoryTree = book.category
    ? await categoryRepository.findHierarchy(book.category.decimal)
    : null;

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

app.listen(4000, () => console.log("server is running on port", 4000));
