import {transaction} from "../infra/umzug/transaction";
import { Client } from "pg";

export const up = transaction( async (client: Client) => {
  // 1. Remove a constraint da FK account_id
  await client.query(`
    ALTER TABLE rating 
    DROP CONSTRAINT rating_account_id_fkey;
  `);

  // 2. Remove a coluna account_id
  await client.query(`
    ALTER TABLE rating 
    DROP COLUMN account_id;
  `);

  // 3. Adiciona a coluna user_id
  await client.query(`
    ALTER TABLE rating 
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
  `);
})

export const down = transaction( async (client: Client) => {
  // Reverte: remove user_id e restaura account_id
  await client.query(`
    ALTER TABLE rating 
    DROP CONSTRAINT rating_user_id_fkey;
  `);

  await client.query(`
    ALTER TABLE rating 
    DROP COLUMN user_id;
  `);

  await client.query(`
    ALTER TABLE rating 
    ADD COLUMN account_id UUID REFERENCES account(id) ON DELETE SET NULL;
  `);
})