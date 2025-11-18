import { loadWorks } from "./loadWorks";
import { loadBooks } from "./loadBooks";
import { loadAuthors } from "./loadAuthors";
import { loadRatings } from "./loadRatings";
import { loadCSV } from "./loadCSV";

export async function loadDataset() {
  const authorMapping = loadCSV("data/author_mapping.csv");
  const workMapping = loadCSV("data/work_mapping.csv");
  const bookMapping = loadCSV("data/book_mapping.csv");

  await loadAuthors();
  await loadWorks({ authorMapping });
  await loadBooks({ workMapping, authorMapping });
  await loadRatings({ workMapping, bookMapping });
}
