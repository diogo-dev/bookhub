import { transaction } from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction(async (client: Client) => {
  await client.query("ALTER TABLE dewey_category DROP COLUMN description;");
});

export const down = transaction(async (client: Client) => {
  await client.query("ALTER TABLE dewey_category ADD COLUMN description TEXT;");
});
