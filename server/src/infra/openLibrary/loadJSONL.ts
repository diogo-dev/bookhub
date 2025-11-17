import fs from "fs";
import path from "path";

export async function loadJSONL<FileRecord>(params: {
  relativePath: string,
  store: (batch: FileRecord[]) => Promise<void>
}): Promise<void> {
  if (!params.relativePath.includes(".jsonl")) throw new Error("Input file must be of type JSONL");

  const absolutePath = path.resolve(__dirname, params.relativePath);
  const fileContent = fs.readFileSync(absolutePath, "utf-8");

  const BATCH_LIMIT = 10_000;
  let batch: FileRecord[] = [];

  const flush = async () => {
    await params.store(batch);
    batch = [];
  }

  for (const line of fileContent.split("\n")) {
    const record: FileRecord = JSON.parse(line);
    batch.push(record);

    if (batch.length >= BATCH_LIMIT) {
      await flush();
    }
  }

  if (batch.length) {
    await flush();
  }
}
