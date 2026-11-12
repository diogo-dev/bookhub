import bcrypt from "bcrypt";
import { UserAccount } from "@/domain/UserAccount";
import { HttpError } from "@/errors/HttpError";
import { UsersRepository } from "@/repositories/UsersRepository";
import { AuthService } from "@/auth/auth.service";
import { RegisterResponse } from "@/dto/RegisterResponse";
import { CreateUserData, UpdateUserData } from "@/schemas/userSchemas";

export class UserService {
  constructor(
    private usersRepository: UsersRepository,
    private authService: AuthService,
  ) {}

  async getById(id: string): Promise<UserAccount> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new HttpError(404, "user not found");
    return user;
  }

  async getByCpf(cpf: string): Promise<UserAccount> {
    const user = await this.usersRepository.findByCpf(cpf);
    if (!user) throw new HttpError(404, "user not found");
    return user;
  }

  async list(): Promise<UserAccount[]> {
    return this.usersRepository.findAll();
  }

  async create(data: CreateUserData): Promise<RegisterResponse["user"]> {
    const existingEmail = await this.usersRepository.findByEmail(data.email);
    if (existingEmail) throw new HttpError(400, "Email already in use");

    const existingCpf = await this.usersRepository.findByCpf(data.cpf);
    if (existingCpf) throw new HttpError(400, "CPF already in use");

    const { user } = await this.authService.register({
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      password: data.password,
      roleName: data.roleName || "EMPLOYEE",
    });

    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<UserAccount> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) throw new HttpError(404, "user not found");

    if (data.name || data.email || data.password) {
      const profileData: { name?: string; email?: string; password_hash?: string } = {};
      if (data.name) profileData.name = data.name;
      if (data.email) profileData.email = data.email;
      if (data.password) profileData.password_hash = await bcrypt.hash(data.password, 10);

      await this.usersRepository.updateProfile(id, profileData);
    }

    if (data.roleNames) {
      await this.usersRepository.updateRoles(id, data.roleNames);
    }

    const updated = await this.usersRepository.findById(id);
    if (!updated) throw new HttpError(404, "error searching updated user");
    return updated;
  }

  async delete(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) {
      throw new HttpError(400, "you cannot delete your own account");
    }

    await this.usersRepository.deleteById(id);
  }
}
