import { loadDataset } from "../infra/openLibrary/loadDataset";
import { client } from "../infra/pg/connection";
import { Permission } from "../domain/Permission";
import { Role } from "../domain/Role";
import { UserAccount } from "../domain/UserAccount";
import { BookItem } from "../domain/BookItem";
import { Reservation } from "../domain/Reservation";
import { Loan } from "../domain/Loan";
import { PermissionRepositoryPostgresImpl } from "../repositories/impl/postgres/PermissionRepositoryPostgresImpl";
import { RoleRepositoryPostgresImpl } from "../repositories/impl/postgres/RoleRepositoryPostgresImpl";
import { UsersRepositoryPosgresImpl } from "../repositories/impl/postgres/UsersRepositoryPosgresImpl";
import { ItemRepositoryPostgresImpl } from "../repositories/impl/postgres/ItemRepositoryPostgresImpl";
import { ReservationRepositoryPostgresImpl } from "../repositories/impl/postgres/ReservationRepositoryPostgresImpl";
import { LoanRepositoryPostgresImpl } from "../repositories/impl/postgres/LoanRepositoryPostgresImpl";
import bcrypt from "bcrypt";

const permissionRepository = new PermissionRepositoryPostgresImpl(client);
const roleRepository = new RoleRepositoryPostgresImpl(client);
const usersRepository = new UsersRepositoryPosgresImpl(client);

async function initializePermissions(): Promise<Map<string, Permission>> {
  console.log("Inicializando permissões...");
  
  const permissionNames = [
    "READ_BOOKS",
    "CREATE_BOOKS",
    "UPDATE_BOOKS",
    "DELETE_BOOKS",
    "MANAGE_LOANS",
    "MANAGE_RESERVATIONS",
    "MANAGE_USERS",
    "MANAGE_ROLES",
    "VIEW_ADMIN_PANEL"
  ];

  const permissions = new Map<string, Permission>();

  for (const name of permissionNames) {
    let permission = await permissionRepository.findByName(name);
    if (!permission) {
      permission = new Permission(name);
      await permissionRepository.save(permission);
      console.log(`  ✓ Permissão criada: ${name}`);
    } else {
      console.log(`  - Permissão já existe: ${name}`);
    }
    permissions.set(name, permission);
  }

  return permissions;
}

async function initializeRoles(permissions: Map<string, Permission>): Promise<Map<string, Role>> {
  console.log("\nInicializando roles...");

  const rolesConfig = [
    {
      name: "USER",
      permissions: ["READ_BOOKS"]
    },
    {
      name: "EMPLOYEE",
      permissions: [
        "READ_BOOKS",
        "CREATE_BOOKS",
        "UPDATE_BOOKS",
        "DELETE_BOOKS",
        "MANAGE_LOANS",
        "MANAGE_RESERVATIONS"
      ]
    },
    {
      name: "ADMIN",
      permissions: [
        "READ_BOOKS",
        "CREATE_BOOKS",
        "UPDATE_BOOKS",
        "DELETE_BOOKS",
        "MANAGE_LOANS",
        "MANAGE_RESERVATIONS",
        "MANAGE_USERS",
        "MANAGE_ROLES",
        "VIEW_ADMIN_PANEL"
      ]
    }
  ];

  const roles = new Map<string, Role>();

  for (const config of rolesConfig) {
    let role = await roleRepository.getRoleByName(config.name);
    
    const rolePermissions = config.permissions
      .map(name => permissions.get(name))
      .filter((p): p is Permission => p !== undefined);
    
    if (!role) {
      role = new Role(config.name, rolePermissions);
      await roleRepository.save(role);
      console.log(`  ✓ Role criada: ${config.name} (${rolePermissions.length} permissões)`);
    } else {
      // Atualizar permissões da role preservando ID e createdAt
      role = new Role(config.name, rolePermissions, role.ID, role.createdAt);
      await roleRepository.save(role);
      console.log(`  - Role já existe: ${config.name} (atualizada com ${rolePermissions.length} permissões)`);
    }
    
    roles.set(config.name, role);
  }

  return roles;
}

async function createTestUsers(roles: Map<string, Role>): Promise<void> {
  console.log("\nCriando usuários de teste...");

  const testUsers = [
    {
      name: "Usuário Teste",
      email: "user@test.com",
      cpf: "12345678901",
      password: "123456",
      roleName: "USER"
    },
    {
      name: "Funcionário Teste",
      email: "funcionario@test.com",
      cpf: "12345678902",
      password: "123456",
      roleName: "EMPLOYEE"
    },
    {
      name: "Admin Teste",
      email: "admin@test.com",
      cpf: "12345678903",
      password: "123456",
      roleName: "ADMIN"
    }
  ];

  for (const userData of testUsers) {
    const existingUser = await usersRepository.findByEmail(userData.email);
    
    if (!existingUser) {
      const role = roles.get(userData.roleName);
      if (!role) {
        console.log(`  ✗ Role não encontrada: ${userData.roleName}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);
      const user = new UserAccount(
        userData.name,
        userData.email,
        userData.cpf,
        [role],
        passwordHash
      );

      await usersRepository.save(user);
      console.log(`  ✓ Usuário criado: ${userData.email} (${userData.roleName})`);
    } else {
      console.log(`  - Usuário já existe: ${userData.email}`);
    }
  }
}

async function ensureAllBooksHaveItems(): Promise<void> {
  const itemRepository = new ItemRepositoryPostgresImpl(client);
  
  const booksWithoutItems = await client.query(`
    SELECT b.isbn
    FROM book b
    LEFT JOIN book_item bi ON bi.isbn = b.isbn
    WHERE bi.id IS NULL;
  `);

  if (booksWithoutItems.rows.length === 0) {
    return;
  }

  let added = 0;
  for (const book of booksWithoutItems.rows) {
    try {
      const item = new BookItem(book.isbn);
      await itemRepository.save(item);
      added++;
    } catch (error) {
      console.error(`Erro ao adicionar item para ${book.isbn}:`, error);
    }
  }

  console.log(`${added} itens adicionados para livros sem itens.`);
}

async function createDemoData(roles: Map<string, Role>): Promise<void> {
  console.log("\nCriando dados de demonstração...");
  
  const usersRepository = new UsersRepositoryPosgresImpl(client);
  const itemRepository = new ItemRepositoryPostgresImpl(client);
  const reservationRepository = new ReservationRepositoryPostgresImpl(client);
  const loanRepository = new LoanRepositoryPostgresImpl(client);

  // Criar mais usuários de demonstração
  const demoUsers = [
    {
      name: "Maria Silva",
      email: "maria@demo.com",
      cpf: "11111111111",
      password: "123456",
      roleName: "USER"
    },
    {
      name: "João Santos",
      email: "joao@demo.com",
      cpf: "22222222222",
      password: "123456",
      roleName: "USER"
    },
    {
      name: "Ana Costa",
      email: "ana@demo.com",
      cpf: "33333333333",
      password: "123456",
      roleName: "USER"
    },
    {
      name: "Pedro Oliveira",
      email: "pedro@demo.com",
      cpf: "44444444444",
      password: "123456",
      roleName: "USER"
    },
    {
      name: "Carla Ferreira",
      email: "carla@demo.com",
      cpf: "55555555555",
      password: "123456",
      roleName: "USER"
    },
    {
      name: "Roberto Alves",
      email: "roberto@demo.com",
      cpf: "66666666666",
      password: "123456",
      roleName: "EMPLOYEE"
    },
    {
      name: "Juliana Lima",
      email: "juliana@demo.com",
      cpf: "77777777777",
      password: "123456",
      roleName: "EMPLOYEE"
    },
    {
      name: "Carlos Souza",
      email: "carlos@demo.com",
      cpf: "88888888888",
      password: "123456",
      roleName: "ADMIN"
    }
  ];

  const createdUsers: Map<string, UserAccount> = new Map();

  for (const userData of demoUsers) {
    let user = await usersRepository.findByEmail(userData.email);
    
    if (!user) {
      const role = roles.get(userData.roleName);
      if (!role) {
        console.log(`  ✗ Role não encontrada: ${userData.roleName}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);
      user = new UserAccount(
        userData.name,
        userData.email,
        userData.cpf,
        [role],
        passwordHash
      );

      await usersRepository.save(user);
      console.log(`  ✓ Usuário criado: ${userData.email} (${userData.roleName})`);
    } else {
      console.log(`  - Usuário já existe: ${userData.email}`);
    }
    
    createdUsers.set(userData.email, user);
  }

  // Buscar alguns livros com itens disponíveis
  const booksResult = await client.query(`
    SELECT DISTINCT b.isbn, b.title
    FROM book b
    JOIN book_item bi ON bi.isbn = b.isbn
    WHERE bi.status = 'disponivel'
    LIMIT 20;
  `);

  if (booksResult.rows.length === 0) {
    console.log("  ⚠ Nenhum livro disponível encontrado. Pulando criação de reservas e empréstimos.");
    return;
  }

  const books = booksResult.rows;
  console.log(`  ✓ Encontrados ${books.length} livros disponíveis`);

  // Criar reservas ativas e futuras
  console.log("\n  Criando reservas...");
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  let reservationCount = 0;
  const userEmails = Array.from(createdUsers.keys()).filter(email => {
    const user = createdUsers.get(email)!;
    return user.roles.some(r => r.name === "USER");
  });

  // Reservas ativas (começaram hoje e terminam em alguns dias)
  for (let i = 0; i < Math.min(5, books.length); i++) {
    if (userEmails.length === 0) break;
    
    const book = books[i];
    const items = await itemRepository.findByISBN(book.isbn);
    const availableItem = items.find(item => item.status === "disponivel");
    
    if (!availableItem) continue;

    const userEmail = userEmails[i % userEmails.length];
    const user = createdUsers.get(userEmail)!;

    try {
      const startAt = now - (i * oneDay); // Começaram em dias diferentes
      const endAt = startAt + (3 * oneDay); // Duram 3 dias

      const reservation = new Reservation(
        crypto.randomUUID(),
        "",
        user.ID,
        availableItem.ID,
        startAt,
        endAt,
        startAt - oneDay // Criada um dia antes
      );

      await reservationRepository.save(reservation);
      await itemRepository.updateStatus(availableItem.ID, "reservado");
      reservationCount++;
    } catch (error) {
      console.error(`    ✗ Erro ao criar reserva para ${book.title}:`, error);
    }
  }

  // Reservas futuras (começam em alguns dias)
  for (let i = 5; i < Math.min(8, books.length); i++) {
    if (userEmails.length === 0) break;
    
    const book = books[i];
    const items = await itemRepository.findByISBN(book.isbn);
    const availableItem = items.find(item => item.status === "disponivel");
    
    if (!availableItem) continue;

    const userEmail = userEmails[i % userEmails.length];
    const user = createdUsers.get(userEmail)!;

    try {
      const startAt = now + ((i - 4) * oneDay); // Começam em dias futuros
      const endAt = startAt + (3 * oneDay);

      const reservation = new Reservation(
        crypto.randomUUID(),
        "",
        user.ID,
        availableItem.ID,
        startAt,
        endAt,
        now - oneDay
      );

      await reservationRepository.save(reservation);
      await itemRepository.updateStatus(availableItem.ID, "reservado");
      reservationCount++;
    } catch (error) {
      console.error(`    ✗ Erro ao criar reserva futura para ${book.title}:`, error);
    }
  }

  console.log(`  ✓ ${reservationCount} reservas criadas`);

  // Criar empréstimos ativos
  console.log("\n  Criando empréstimos ativos...");
  let activeLoanCount = 0;

  for (let i = 8; i < Math.min(12, books.length); i++) {
    if (userEmails.length === 0) break;
    
    const book = books[i];
    const items = await itemRepository.findByISBN(book.isbn);
    const availableItem = items.find(item => item.status === "disponivel");
    
    if (!availableItem) continue;

    const userEmail = userEmails[i % userEmails.length];
    const user = createdUsers.get(userEmail)!;

    try {
      const startAt = now - (i * oneDay);
      const dueAt = startAt + (14 * oneDay); // Prazo de 14 dias

      const loan = new Loan(
        user.ID,
        availableItem.ID,
        startAt,
        dueAt,
        null,
        undefined,
        undefined,
        null,
        "ativo",
        startAt
      );

      await loanRepository.save(loan);
      await itemRepository.updateStatus(availableItem.ID, "emprestado");
      activeLoanCount++;
    } catch (error) {
      console.error(`    ✗ Erro ao criar empréstimo ativo para ${book.title}:`, error);
    }
  }

  console.log(`  ✓ ${activeLoanCount} empréstimos ativos criados`);

  // Criar empréstimos atrasados
  console.log("\n  Criando empréstimos atrasados...");
  let lateLoanCount = 0;

  for (let i = 12; i < Math.min(15, books.length); i++) {
    if (userEmails.length === 0) break;
    
    const book = books[i];
    const items = await itemRepository.findByISBN(book.isbn);
    const availableItem = items.find(item => item.status === "disponivel");
    
    if (!availableItem) continue;

    const userEmail = userEmails[i % userEmails.length];
    const user = createdUsers.get(userEmail)!;

    try {
      const startAt = now - (20 * oneDay); // Começou há 20 dias
      const dueAt = startAt + (14 * oneDay); // Venceu há 6 dias

      const loan = new Loan(
        user.ID,
        availableItem.ID,
        startAt,
        dueAt,
        null,
        undefined,
        undefined,
        null,
        "atrasado",
        startAt
      );

      await loanRepository.save(loan);
      await itemRepository.updateStatus(availableItem.ID, "emprestado");
      lateLoanCount++;
    } catch (error) {
      console.error(`    ✗ Erro ao criar empréstimo atrasado para ${book.title}:`, error);
    }
  }

  console.log(`  ✓ ${lateLoanCount} empréstimos atrasados criados`);

  // Criar empréstimos devolvidos (histórico)
  console.log("\n  Criando empréstimos devolvidos (histórico)...");
  let returnedLoanCount = 0;

  for (let i = 15; i < Math.min(20, books.length); i++) {
    if (userEmails.length === 0) break;
    
    const book = books[i];
    const items = await itemRepository.findByISBN(book.isbn);
    const availableItem = items.find(item => item.status === "disponivel");
    
    if (!availableItem) continue;

    const userEmail = userEmails[i % userEmails.length];
    const user = createdUsers.get(userEmail)!;

    try {
      const startAt = now - (30 * oneDay); // Começou há 30 dias
      const dueAt = startAt + (14 * oneDay);
      const returnedAt = startAt + (10 * oneDay); // Devolvido há 20 dias (dentro do prazo)

      const loan = new Loan(
        user.ID,
        availableItem.ID,
        startAt,
        dueAt,
        null,
        undefined,
        undefined,
        returnedAt,
        "devolvido",
        startAt
      );

      await loanRepository.save(loan);
      // Item volta a ficar disponível
      await itemRepository.updateStatus(availableItem.ID, "disponivel");
      returnedLoanCount++;
    } catch (error) {
      console.error(`    ✗ Erro ao criar empréstimo devolvido para ${book.title}:`, error);
    }
  }

  console.log(`  ✓ ${returnedLoanCount} empréstimos devolvidos criados`);

  // Criar empréstimos a partir de reservas
  console.log("\n  Criando empréstimos a partir de reservas...");
  let reservationLoanCount = 0;

  // Buscar algumas reservas ativas que podem ser convertidas em empréstimos
  const activeReservations = await client.query(`
    SELECT r.*, bi.isbn
    FROM reservation r
    JOIN book_item bi ON bi.id = r.item_id
    WHERE bi.status = 'reservado'
    AND r.end_at > $1
    LIMIT 3;
  `, [now]);

  for (const row of activeReservations.rows) {
    try {
      const user = await usersRepository.findById(row.user_id);
      if (!user) continue;

      const item = await itemRepository.find(row.item_id);
      if (!item) continue;

      // Criar empréstimo a partir da reserva
      const startAt = now;
      const dueAt = startAt + (14 * oneDay);

      const loan = new Loan(
        user.ID,
        item.ID,
        startAt,
        dueAt,
        row.id, // ID da reserva
        undefined,
        undefined,
        null,
        "ativo",
        startAt
      );

      await loanRepository.save(loan);
      await itemRepository.updateStatus(item.ID, "emprestado");
      reservationLoanCount++;
    } catch (error) {
      console.error(`    ✗ Erro ao criar empréstimo a partir de reserva:`, error);
    }
  }

  console.log(`  ✓ ${reservationLoanCount} empréstimos criados a partir de reservas`);

  console.log("\n✓ Dados de demonstração criados com sucesso!");
}

async function populate() {
  const start = Date.now();
  const progress = setInterval(() => {
    const end = Date.now();
    const duration = Math.floor((end - start) / 1000);
    process.stdout.write(`\r(${duration}s) populating database...`);
  }, 1000);

  try {
    const permissions = await initializePermissions();
    
    const roles = await initializeRoles(permissions);
    
    await createTestUsers(roles);
    
    console.log("\nCarregando dataset de livros...");
    await loadDataset();
    
    await ensureAllBooksHaveItems();
    
    await client.query("REFRESH MATERIALIZED VIEW CONCURRENTLY book_popularity;");
    
    // Criar dados de demonstração
    await createDemoData(roles);
    
    clearInterval(progress);
    
    console.log("\nBanco de dados populado com sucesso");
    console.log("\nUsuários de teste criados:");
    console.log("  - user@test.com / 123456 (USER)");
    console.log("  - funcionario@test.com / 123456 (EMPLOYEE)");
    console.log("  - admin@test.com / 123456 (ADMIN)");
    console.log("\nUsuários de demonstração criados:");
    console.log("  - maria@demo.com / 123456 (USER)");
    console.log("  - joao@demo.com / 123456 (USER)");
    console.log("  - ana@demo.com / 123456 (USER)");
    console.log("  - pedro@demo.com / 123456 (USER)");
    console.log("  - carla@demo.com / 123456 (USER)");
    console.log("  - roberto@demo.com / 123456 (EMPLOYEE)");
    console.log("  - juliana@demo.com / 123456 (EMPLOYEE)");
    console.log("  - carlos@demo.com / 123456 (ADMIN)");
    
  } catch (error) {
    clearInterval(progress);
    console.error("\n Erro ao popular banco de dados:", error);
    throw error;
  } finally {
    await client.end();
  }
}

populate();
