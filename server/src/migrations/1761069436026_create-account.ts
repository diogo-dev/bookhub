import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {
  await client.query(`
    CREATE TABLE account (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
    );
  `);
});

export const down = transaction(async (client: Client) => {
  await client.query("DROP TABLE account;");
});
