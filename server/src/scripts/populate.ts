import { loadDataset } from "../infra/openLibrary/loadDataset";
import { client } from "../infra/pg/connection";

(async function populate() {
  await loadDataset();
  await client.end();
})();
