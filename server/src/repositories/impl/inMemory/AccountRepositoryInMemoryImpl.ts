import { AccountRepository } from "@/repositories/AccountRepository";
import { Account } from "@/domain/Account";

export class AccountRepositoryInMemoryImpl implements AccountRepository {
  private accounts: Map<string, Account> = new Map();

  public async find(id: string): Promise<Account | null> {
    return this.accounts.get(id) || null;
  }

  public async findByEmail(email: string): Promise<Account | null> {
    return Array.from(this.accounts.values()).find((account) => account.email == email) || null;
  }

  public async save(account: Account): Promise<void> {
    this.accounts.set(account.ID, account);
  }
}
