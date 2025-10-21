import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {
  await client.query(`
    CREATE TABLE rating (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id UUID REFERENCES account(id) ON DELETE SET NULL,
      work_id UUID NOT NULL REFERENCES work(id) ON DELETE CASCADE,
      book_isbn VARCHAR(13) REFERENCES book(isbn) ON DELETE CASCADE,
      score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
      created_at BIGINT DEFAULT (EXTRACT (EPOCH FROM NOW()))
    );
  `);
});

export const down = transaction(async (client: Client) => {
  await client.query("DROP TABLE rating;");
});
