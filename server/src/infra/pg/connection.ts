import "dotenv/config";
import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect()
  .then(() => console.log("Connected to database.\n"))
  .catch(error => console.log("Connection failed.\n", error));

export { client };
