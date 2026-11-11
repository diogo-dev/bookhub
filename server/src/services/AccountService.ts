import bcrypt from "bcrypt";
import { Account } from "@/domain/Account";
import { AccountRepository } from "@/repositories/AccountRepository";
import { HttpError } from "@/errors/HttpError";

const SALT_ROUNDS = 10;

export class AccountService {
  constructor(private accountRepository: AccountRepository) {}

  async register(email: string, password: string): Promise<Account> {
    const existing = await this.accountRepository.findByEmail(email);
    if (existing) throw new HttpError(400, "email already used");

    const account = new Account();
    account.email = email;
    account.password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    await this.accountRepository.save(account);
    return account;
  }
}
