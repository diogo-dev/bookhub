import "dotenv/config";
import { Client } from "pg";

const client = new Client({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME
});

client.connect()
  .then(() => console.log("Connected to database.\n"))
  .catch(error => console.log("Connection failed.\n", error));

export { client };
