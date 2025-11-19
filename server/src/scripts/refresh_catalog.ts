import cron from "node-cron";
import { client } from "../infra/pg/connection";

cron.schedule("0 * * * *", async () => {
  await client.query("REFRESH MATERIALIZED VIEW CONCURRENTLY book_popularity;");
});
