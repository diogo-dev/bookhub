import fs from "fs";
import path from "path";
import { fetchDump } from "./fetchDump";

export async function downloadDump<IProvided, IRequired>(params: {
  name: string,
  inputURL: string,
  outputPath: string,
  parse: (line: string) => IProvided,
  adapt: (obj: IProvided) => IRequired
}): Promise<void> {
  console.log(`Fetching ${params.name} dump...`);
  const inputStream = await fetchDump(params.inputURL);

  if (!params.outputPath.includes(".jsonl")) throw new Error("Output path must be of type JSONL");
  const outputStream = fs.createWriteStream(path.resolve(__dirname, params.outputPath), { flags: 'w' });

  let recordsCount = 0;
  let insertionsCount = 0;

  const BATCH_LIMIT = 10_000;
  let batch: string[] = [];

  const flush = async () => {
    outputStream.write(batch.join("\n"));
    batch = [];
  }

  const start = Date.now();
  for await (const record of inputStream) {
    if (!record.trim()) continue;
    recordsCount++;

    const providedInterface = params.parse(record);
    const requiredInterface = params.adapt(providedInterface);

    if (requiredInterface != null) {
      batch.push(JSON.stringify(requiredInterface));
      insertionsCount++;
    }

    if (batch.length >= BATCH_LIMIT) {
      await flush();
    }

    const end = Date.now();
    const duration = Math.floor((end - start) / 1000);
    process.stdout.write(`\r(${duration}s) records: ${recordsCount} | insertions: ${insertionsCount}`.padEnd(80, " "));
  }

  if (batch.length) {
    await flush();
  }

  outputStream.end();
  console.log("\n");
}
