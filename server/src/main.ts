import 'tsconfig-paths/register';
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
import { authenticateJWT, authorizeRoles } from "./auth/middleware";

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
        message: error.message || "Erro ao buscar usuário por cpf"
      });
  }
})

app.get("/loans/users/:cpf", authenticateJWT, async (req: Request, res: Response) => {
  try {
      const schema = z.object({
      cpf: z.string().min(11).max(14)
    });

    const params = schema.parse(req.params);
    const user = await usersRepository.findByCpf(params.cpf);
    if (!user) throw new HttpError(404, "user not found");

    const loans = await loanService.getUserLoansAndBookInfo(user.ID);
    if (!loans) throw new HttpError(404, "loans not found");

    return res.status(200).json({
      user,
      loans
    })
  } catch (error: any) {
      return res.status(400).json({
        message: error.message || "Erro ao buscar usuário por cpf"
    });

  }
  
})

app.get("/users/id/:id", async (request: Request, response: Response) => {
 const schema = z.object({
    id: z.uuid()
  });

  const params = schema.parse(request.params);

  const user = await usersRepository.findById(params.id);

  if (!user) throw new HttpError(404, "user not found");

  response.json(user);
})

app.get("/users/cpf/:cpf", async (request: Request, response: Response) => {
 const schema = z.object({
    cpf: z.string().min(11).max(14)
  });

  const params = schema.parse(request.params);

  const user = await usersRepository.findByCpf(params.cpf);

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

app.get('/users', authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await usersRepository.findAll();
    
    return res.status(200).json(users.map(user => ({
      id: user.ID,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      roles: user.roles.map(r => r.name),
      createdAt: user.createdAt
    })));
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao listar usuários." });
  }
});

app.post('/users', authenticateJWT, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      cpf: z.string().min(11).max(14),
      password: z.string().min(6),
      roleName: z.string().optional()
    });

    const params = schema.parse(req.body);
    
    const existingUser = await usersRepository.findByEmail(params.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email já está em uso." });
    }

    const existingCpf = await usersRepository.findByCpf(params.cpf);
    if (existingCpf) {
      return res.status(400).json({ message: "CPF já está em uso." });
    }

    const result = await authService.register({
      name: params.name,
      email: params.email,
      cpf: params.cpf,
      password: params.password,
      roleName: params.roleName || 'EMPLOYEE'
    });

    return res.status(201).json({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      cpf: result.user.cpf,
      roles: result.user.roles.map((r: any) => typeof r === 'string' ? r : r.name)
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Erro de validação", errors: error.issues });
    }
    return res.status(400).json({ message: error.message || "Falha ao criar funcionário." });
  }
});

app.patch('/users/:id', authenticateJWT, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      id: z.uuid()
    });

    const params = schema.parse(req.params);
    const updateSchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      password: z.string().optional(),
      roleNames: z.array(z.string()).optional()
    });

    const updateData = updateSchema.parse(req.body);
    const userId = params.id;

    const existingUser = await usersRepository.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (updateData.name || updateData.email || updateData.password) {
      const profileData: any = {};
      if (updateData.name) profileData.name = updateData.name;
      if (updateData.email) profileData.email = updateData.email;
      if (updateData.password) {
        const passwordHash = await bcrypt.hash(updateData.password, 10);
        profileData.password_hash = passwordHash;
      }
      
      await usersRepository.updateProfile(userId, profileData);
    }

    if (updateData.roleNames) {
      await usersRepository.updateRoles(userId, updateData.roleNames);
    }

    const updatedUser = await usersRepository.findById(userId);
    if (!updatedUser) {
      return res.status(404).json({ message: "Erro ao buscar usuário atualizado." });
    }

    return res.status(200).json({
      id: updatedUser.ID,
      name: updatedUser.name,
      email: updatedUser.email,
      cpf: updatedUser.cpf,
      roles: updatedUser.roles.map(r => r.name),
      createdAt: updatedUser.createdAt
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Erro de validação", errors: error.issues });
    }
    return res.status(400).json({ message: error.message || "Falha ao atualizar funcionário." });
  }
});

app.delete('/users/:id', authenticateJWT, authorizeRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      id: z.uuid()
    });

    const params = schema.parse(req.params);
    const userId = params.id;

    if (userId === req.user!.sub) {
      return res.status(400).json({ message: "Você não pode deletar sua própria conta." });
    }

    await usersRepository.deleteById(userId);

    return res.status(200).json({ message: "Funcionário deletado com sucesso." });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Erro de validação", errors: error.issues });
    }
    return res.status(400).json({ message: error.message || "Falha ao deletar funcionário." });
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
    const loans = await loanService.getUserLoansAndBookInfo(userId);
    return res.status(200).json(loans);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao buscar empréstimos do usuário." });
  }
});

app.get("/me/reservations", authenticateJWT, async(req: AuthRequest, res: Response) => { 
  try { 
    const userId = req.user!.sub;
    const reservations = await reservationRepository.findReservationListByUser(userId);
    return res.status(200).json(reservations);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao buscar reservas do usuário." });
  }
});

app.get("/users/:id/loans", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      id: z.uuid()
    });

    const params = schema.parse(req.params);
    const loans = await loanService.getUserLoansAndBookInfo(params.id);
    return res.status(200).json(loans);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao buscar empréstimos do usuário." });
  }
});

app.get("/users/:id/reservations", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      id: z.uuid()
    });

    const params = schema.parse(req.params);
    const reservations = await reservationRepository.findReservationListByUser(params.id);
    return res.status(200).json(reservations);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || "Falha ao buscar reservas do usuário." });
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
      userID: z.uuid(),
      startAt: z.coerce.number(),
      dueAt: z.coerce.number(),
      reservationID: z.uuid().optional()
    });

    const params = schema.parse(req.body);

    const loan = await loanService.createLoan(params.userID, params.itemID, params.startAt, params.dueAt, params.reservationID);

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
    
    const loan = await loanRepository.findById(params.id);
    if (!loan) {
      return res.status(404).json({ message: "Empréstimo não encontrado" });
    }
    
    const returnedLoan = await loanService.returnLoanAndItem(params.id);

    return res.status(200).json({
      message: "Empréstimo devolvido com sucesso.",
      loan: returnedLoan.loan,
      item: returnedLoan.item
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

  const existingLanguage = await languageRepository.find(params.isoCode);
  
  if (existingLanguage) {
    return response.status(200).json(existingLanguage);
  }

  const language = new Language();
  language.isoCode = params.isoCode;
  language.name = params.name;

  await languageRepository.save(language);

  response.status(201).json(language);
});

app.post("/languages/find-or-create", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    if (!request.body) throw new HttpError(400, "body is required");

    const schema = z.object({
      name: z.string().min(1),
      isoCode: z.string().min(2).max(35).regex(bcp47Pattern).optional()
    });

    const params = schema.parse(request.body);

    if (params.isoCode) {
      const existingLanguage = await languageRepository.find(params.isoCode);
      if (existingLanguage) {
        return response.status(200).json(existingLanguage);
      }
    }

    const existingByName = await client.query(
      "SELECT iso_code FROM language WHERE LOWER(name) = LOWER($1) LIMIT 1;",
      [params.name]
    );

    if (existingByName.rows.length > 0) {
      const existingLanguage = await languageRepository.find(existingByName.rows[0].iso_code);
      return response.status(200).json(existingLanguage);
    }

    const isoCode = params.isoCode || (params.name.toLowerCase().includes('português') ? 'pt-BR' : 
                                       params.name.toLowerCase().includes('inglês') ? 'en-US' :
                                       params.name.toLowerCase().includes('espanhol') ? 'es-ES' :
                                       params.name.toLowerCase().includes('francês') ? 'fr-FR' :
                                       params.name.substring(0, 2).toLowerCase() + '-' + params.name.substring(0, 2).toUpperCase());
    
    const language = new Language();
    language.isoCode = isoCode;
    language.name = params.name;

    await languageRepository.save(language);

    response.status(201).json(language);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return response.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: "Erro de validação", errors: error.issues });
    }
    return response.status(400).json({ message: error.message || "Falha ao buscar/criar idioma." });
  }
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
    biography: z.string().optional().default(""),
    birthDate: z.coerce.date().optional(),
    deathDate: z.coerce.date().optional(),
  });

  const params = schema.parse(request.body);

  const existingAuthors = await client.query(
    "SELECT id FROM author WHERE LOWER(name) = LOWER($1) LIMIT 1;",
    [params.name]
  );

  if (existingAuthors.rows.length > 0) {
    const existingAuthor = await authorRepository.find(existingAuthors.rows[0].id);
    return response.status(200).json(existingAuthor);
  }

  const author = new Author();
  author.name = params.name;
  author.biography = params.biography || "";
  author.birthDate = params.birthDate || null;
  author.deathDate = params.deathDate || null;

  await authorRepository.save(author);

  response.status(201).json(author);
});

app.post("/authors/find-or-create", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    if (!request.body) throw new HttpError(400, "body is required");

    const schema = z.object({
      name: z.string().min(1)
    });

    const params = schema.parse(request.body);

    const existingAuthors = await client.query(
      "SELECT id FROM author WHERE LOWER(name) = LOWER($1) LIMIT 1;",
      [params.name]
    );

    if (existingAuthors.rows.length > 0) {
      const existingAuthor = await authorRepository.find(existingAuthors.rows[0].id);
      return response.status(200).json(existingAuthor);
    }

    const author = new Author();
    author.name = params.name;
    author.biography = "";
    author.birthDate = null;
    author.deathDate = null;

    await authorRepository.save(author);

    response.status(201).json(author);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return response.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: "Erro de validação", errors: error.issues });
    }
    return response.status(400).json({ message: error.message || "Falha ao buscar/criar autor." });
  }
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

  const normalizedName = params.displayName.toLowerCase().trim();
  const existingPublisher = await publisherRepository.find(normalizedName);
  
  if (existingPublisher) {
    return response.status(200).json(existingPublisher);
  }

  const publisher = new Publisher();
  publisher.displayName = params.displayName;

  await publisherRepository.save(publisher);

  response.status(201).json(publisher);
});

app.post("/publishers/find-or-create", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    if (!request.body) throw new HttpError(400, "body is required");

    const schema = z.object({
      displayName: z.string().min(1)
    });

    const params = schema.parse(request.body);

    const normalizedName = params.displayName.toLowerCase().trim();
    const existingPublisher = await publisherRepository.find(normalizedName);
    
    if (existingPublisher) {
      return response.status(200).json(existingPublisher);
    }

    const publisher = new Publisher();
    publisher.displayName = params.displayName;

    await publisherRepository.save(publisher);

    response.status(201).json(publisher);
  } catch (error: any) {
    if (error instanceof HttpError) {
      return response.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof z.ZodError) {
      return response.status(400).json({ message: "Erro de validação", errors: error.issues });
    }
    return response.status(400).json({ message: error.message || "Falha ao buscar/criar editora." });
  }
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

app.get("/authors", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    const result = await client.query("SELECT id, name FROM author ORDER BY name;");
    response.json(result.rows.map((row: any) => ({
      ID: row.id,
      name: row.name
    })));
  } catch (error: any) {
    response.status(400).json({ message: error.message || "Falha ao listar autores." });
  }
});

app.get("/publishers", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    const result = await client.query("SELECT name, display_name FROM publisher ORDER BY display_name;");
    response.json(result.rows.map((row: any) => ({
      name: row.name,
      displayName: row.display_name
    })));
  } catch (error: any) {
    response.status(400).json({ message: error.message || "Falha ao listar editores." });
  }
});

app.get("/languages", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    const result = await client.query("SELECT iso_code, name FROM language ORDER BY name;");
    response.json(result.rows.map((row: any) => ({
      isoCode: row.iso_code,
      name: row.name
    })));
  } catch (error: any) {
    response.status(400).json({ message: error.message || "Falha ao listar idiomas." });
  }
});

app.get("/categories", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), async (request: Request, response: Response) => {
  try {
    const result = await client.query("SELECT id, name, decimal FROM dewey_category ORDER BY decimal;");
    response.json(result.rows.map((row: any) => ({
      ID: row.id,
      name: row.name,
      decimal: row.decimal
    })));
  } catch (error: any) {
    response.status(400).json({ message: error.message || "Falha ao listar categorias." });
  }
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

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
}

export default app;
