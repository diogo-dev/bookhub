import fs from "fs";
import path from "path";

export function loadCSV(relativePath: string): Map<string, string> {
  const absolutePath = path.resolve(__dirname, relativePath);
  return new Map<string, string>(
    fs.readFileSync(absolutePath, "utf-8")
      .split("\n")
      .filter(line => line.trim().length > 0) 
      .map(line => {
        const [key, value] = line.split(",");
        return [key.trim(), value.trim()] as [string, string];
      })
  );
}
