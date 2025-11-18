import fs from "fs";
import path from "path";

export function loadCSV(relativePath: string): Map<string, string> {
  const absolutePath = path.resolve(__dirname, relativePath);
  return new Map<string, string>(
    fs.readFileSync(absolutePath, "utf-8")
      .split("\n")
      .map(line => line.split(",")) as [string, string][]
  );
}
