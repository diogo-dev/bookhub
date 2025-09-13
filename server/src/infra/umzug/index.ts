import "dotenv/config";
import { Umzug } from "umzug";
import { Client } from "pg";

import { client } from "../pg/connection"
import { PostgresStorage } from "./PostgresStorage";

const umzug = new Umzug<Client>({
  migrations: { glob: 'src/migrations/*.ts' },
  storage: new PostgresStorage(client),
  context: client,
  logger: console
});

umzug
  .runAsCLI()
  .then(() => client.end());
