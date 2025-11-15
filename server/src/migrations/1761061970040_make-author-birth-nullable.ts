import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {
  await client.query("ALTER TABLE author ALTER COLUMN birth_date DROP NOT NULL;");
});

export const down = transaction(async (client: Client) => {
  await client.query("UPDATE author SET birth_date = '1970-01-01' WHERE birth_date IS NULL;");
  await client.query("ALTER TABLE author ALTER COLUMN birth_date SET NOT NULL;");
});
