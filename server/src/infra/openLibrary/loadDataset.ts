import fs from "fs";
import path from "path";
import { loadWorks } from "./loadWorks";
import { loadBooks } from "./loadBooks";
import { loadAuthors } from "./loadAuthors";
import { loadRatings } from "./loadRatings";

export async function loadDataset() {
  const authorMappingPath = path.resolve(__dirname, "data/author_mapping.csv");
  const authorMapping = new Map<string, string>(
    fs.readFileSync(authorMappingPath, "utf-8")
      .split("\n")
      .map(line => line.split(",")) as [string, string][]
  );

  await loadAuthors();

  await loadWorks({ authorMapping });
  const workMappingPath = path.resolve(__dirname, "data/work_mapping.csv");
  const workMapping = new Map<string, string>(
    fs.readFileSync(workMappingPath, "utf-8")
      .split("\n")
      .map(line => line.split(",")) as [string, string][]
  );

  await loadBooks({ workMapping, authorMapping });

  await loadRatings();
}
