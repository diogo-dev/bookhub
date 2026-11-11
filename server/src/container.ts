import { client } from "@/infra/pg/connection";

import { UsersRepositoryPosgresImpl } from "@/repositories/impl/postgres/UsersRepositoryPosgresImpl";
import { RoleRepositoryPostgresImpl } from "@/repositories/impl/postgres/RoleRepositoryPostgresImpl";
import { BookRepositoryPostgresImpl } from "@/repositories/impl/postgres/BookRepositoryPostgresImpl";
import { ItemRepositoryPostgresImpl } from "@/repositories/impl/postgres/ItemRepositoryPostgresImpl";
import { InterestRepositoryPostgresImpl } from "@/repositories/impl/postgres/InterestRepositoryPostgresImpl";
import { LoanRepositoryPostgresImpl } from "@/repositories/impl/postgres/LoanRepositoryPostgresImpl";
import { ReservationRepositoryPostgresImpl } from "@/repositories/impl/postgres/ReservationRepositoryPostgresImpl";
import { PermissionRepositoryPostgresImpl } from "@/repositories/impl/postgres/PermissionRepositoryPostgresImpl";
import { LanguageRepositoryPostgresImpl } from "@/repositories/impl/postgres/LanguageRepositoryPostgresImpl";
import { AuthorRepositoryPostgresImpl } from "@/repositories/impl/postgres/AuthorRepositoryPostgresImpl";
import { PublisherRepositoryPostgresImpl } from "@/repositories/impl/postgres/PublisherRepositoryPostgresImpl";
import { CategoryRepositoryPostgresImpl } from "@/repositories/impl/postgres/CategoryRepositoryPostgresImpl";
import { AccountRepositoryPostgresImpl } from "@/repositories/impl/postgres/AccountRepositoryPostgresImpl";

import { AuthService } from "@/auth/auth.service";
import { ProfileService } from "@/services/ProfileService";
import { InterestService } from "@/services/InterestService";
import { LoanService } from "@/services/LoanService";
import { PermissionService } from "@/services/PermissionService";
import { RoleService } from "@/services/RoleService";
import { LanguageService } from "@/services/LanguageService";
import { AuthorService } from "@/services/AuthorService";
import { PublisherService } from "@/services/PublisherService";
import { CategoryService } from "@/services/CategoryService";
import { AccountService } from "@/services/AccountService";
import { ReservationService } from "@/services/ReservationService";

import { AuthController } from "@/controllers/authController";
import { MeController } from "@/controllers/meController";
import { PermissionController } from "@/controllers/permissionController";
import { RoleController } from "@/controllers/roleController";
import { LanguageController } from "@/controllers/languageController";
import { AuthorController } from "@/controllers/authorController";
import { PublisherController } from "@/controllers/publisherController";
import { CategoryController } from "@/controllers/categoryController";
import { AccountController } from "@/controllers/accountController";
import { ReservationController } from "@/controllers/reservationController";
import { LoanController } from "@/controllers/loanController";

// Repositories
export const usersRepository = new UsersRepositoryPosgresImpl(client);
export const roleRepository = new RoleRepositoryPostgresImpl(client);
export const bookRepository = new BookRepositoryPostgresImpl(client);
export const itemRepository = new ItemRepositoryPostgresImpl(client);
export const interestRepository = new InterestRepositoryPostgresImpl(client);
export const loanRepository = new LoanRepositoryPostgresImpl(client);
export const reservationRepository = new ReservationRepositoryPostgresImpl(client);
export const permissionRepository = new PermissionRepositoryPostgresImpl(client);
export const languageRepository = new LanguageRepositoryPostgresImpl(client);
export const authorRepository = new AuthorRepositoryPostgresImpl(client);
export const publisherRepository = new PublisherRepositoryPostgresImpl(client);
export const categoryRepository = new CategoryRepositoryPostgresImpl(client);
export const accountRepository = new AccountRepositoryPostgresImpl(client);

// Services
export const authService = new AuthService(usersRepository, roleRepository);
export const profileService = new ProfileService(usersRepository);
export const interestService = new InterestService(interestRepository, bookRepository);
export const loanService = new LoanService(loanRepository, reservationRepository, itemRepository, client);
export const permissionService = new PermissionService(permissionRepository);
export const roleService = new RoleService(roleRepository, permissionRepository);
export const languageService = new LanguageService(languageRepository);
export const authorService = new AuthorService(authorRepository);
export const publisherService = new PublisherService(publisherRepository);
export const categoryService = new CategoryService(categoryRepository);
export const accountService = new AccountService(accountRepository);
export const reservationService = new ReservationService(reservationRepository, itemRepository, client);

// Controllers
export const authController = new AuthController(authService);
export const meController = new MeController(profileService, interestService, loanService, reservationRepository);
export const permissionController = new PermissionController(permissionService);
export const roleController = new RoleController(roleService);
export const languageController = new LanguageController(languageService);
export const authorController = new AuthorController(authorService);
export const publisherController = new PublisherController(publisherService);
export const categoryController = new CategoryController(categoryService);
export const accountController = new AccountController(accountService);
export const reservationController = new ReservationController(reservationService, profileService);
export const loanController = new LoanController(loanService, profileService);
