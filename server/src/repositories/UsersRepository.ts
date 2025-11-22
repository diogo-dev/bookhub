import { UserAccount } from "@/domain/UserAccount";

export interface UsersRepository {
  save(user: UserAccount): Promise<UserAccount>;
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
  getUserRoles(userID: string): Promise<{ roles: string[] } | null>;
  updateProfile(userId: string, data: {name?: string, email?: string, password_hash?: string}): Promise<UserAccount>;
  deleteById(userId: string): Promise<void>;
}