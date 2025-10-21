import { AccountRepository } from "@/repositories/AccountRepository";
import { Account } from "@/domain/Account";
import { Client } from "pg";

export interface AccountRecord {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export class AccountRepositoryPostgresImpl implements AccountRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<Account | null> {
    const result = await this.client.query("SELECT * FROM account WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async findByEmail(email: string): Promise<Account | null> {
    const result = await this.client.query("SELECT * FROM account WHERE email = $1;", [email]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(account: Account): Promise<void> {
    const result = await this.client.query("SELECT * FROM account WHERE id = $1;", [account.ID]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE account SET email = $2, password_hash = $3 WHERE id = $1;",
        [account.ID, account.email, account.password_hash]
      );
    } else {
      await this.client.query(
        "INSERT INTO account (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4);",
        [account.ID, account.email, account.password_hash, account.createdAt]
      );
    }
  }

  private deserialize(record: AccountRecord): Account {
    const account = new Account(record.id, Number(record.created_at));
    account.email = record.email;
    account.password_hash = record.password_hash;
    return account;
  }
}
