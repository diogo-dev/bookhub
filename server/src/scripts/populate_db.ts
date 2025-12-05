import { loadDataset } from "../infra/openLibrary/loadDataset";
import { client } from "../infra/pg/connection";
import { Permission } from "../domain/Permission";
import { Role } from "../domain/Role";
import { UserAccount } from "../domain/UserAccount";
import { BookItem } from "../domain/BookItem";
import { PermissionRepositoryPostgresImpl } from "../repositories/impl/postgres/PermissionRepositoryPostgresImpl";
import { RoleRepositoryPostgresImpl } from "../repositories/impl/postgres/RoleRepositoryPostgresImpl";
import { UsersRepositoryPosgresImpl } from "../repositories/impl/postgres/UsersRepositoryPosgresImpl";
import { ItemRepositoryPostgresImpl } from "../repositories/impl/postgres/ItemRepositoryPostgresImpl";
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
    
    clearInterval(progress);
    
    console.log("\nBanco de dados populado com sucesso");
    console.log("\nUsuários de teste criados:");
    console.log("  - user@test.com / 123456 (USER)");
    console.log("  - funcionario@test.com / 123456 (EMPLOYEE)");
    console.log("  - admin@test.com / 123456 (ADMIN)");
    
  } catch (error) {
    clearInterval(progress);
    console.error("\n Erro ao popular banco de dados:", error);
    throw error;
  } finally {
    await client.end();
  }
}

populate();
