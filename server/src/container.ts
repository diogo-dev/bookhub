import { client } from "@/infra/pg/connection";

import { UsersRepositoryPosgresImpl } from "@/repositories/impl/postgres/UsersRepositoryPosgresImpl";
import { RoleRepositoryPostgresImpl } from "@/repositories/impl/postgres/RoleRepositoryPostgresImpl";
import { BookRepositoryPostgresImpl } from "@/repositories/impl/postgres/BookRepositoryPostgresImpl";
import { ItemRepositoryPostgresImpl } from "@/repositories/impl/postgres/ItemRepositoryPostgresImpl";
import { InterestRepositoryPostgresImpl } from "@/repositories/impl/postgres/InterestRepositoryPostgresImpl";
import { LoanRepositoryPostgresImpl } from "@/repositories/impl/postgres/LoanRepositoryPostgresImpl";
import { ReservationRepositoryPostgresImpl } from "@/repositories/impl/postgres/ReservationRepositoryPostgresImpl";

import { AuthService } from "@/auth/auth.service";
import { ProfileService } from "@/services/ProfileService";
import { InterestService } from "@/services/InterestService";
import { LoanService } from "@/services/LoanService";

import { AuthController } from "@/controllers/authController";
import { MeController } from "@/controllers/meController";

// Repositories
export const usersRepository = new UsersRepositoryPosgresImpl(client);
export const roleRepository = new RoleRepositoryPostgresImpl(client);
export const bookRepository = new BookRepositoryPostgresImpl(client);
export const itemRepository = new ItemRepositoryPostgresImpl(client);
export const interestRepository = new InterestRepositoryPostgresImpl(client);
export const loanRepository = new LoanRepositoryPostgresImpl(client);
export const reservationRepository = new ReservationRepositoryPostgresImpl(client);

// Services
export const authService = new AuthService(usersRepository, roleRepository);
export const profileService = new ProfileService(usersRepository);
export const interestService = new InterestService(interestRepository, bookRepository);
export const loanService = new LoanService(loanRepository, reservationRepository, itemRepository, client);

// Controllers
export const authController = new AuthController(authService);
export const meController = new MeController(profileService, interestService, loanService, reservationRepository);
