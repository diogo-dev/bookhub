import { Account } from "@/domain/Account";

export interface AccountRepository {
  save(account: Account): Promise<void>;
  find(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
}
