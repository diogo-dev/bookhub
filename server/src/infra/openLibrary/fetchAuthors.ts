import fs from "fs/promises";
import path from "path";
import { isValid, parse } from "date-fns";
import { Author } from "../../domain/Author";
import { downloadDump } from "./downloadDump";

interface AuthorOpenLibraryImpl {
  ref: string;
  name?: string;
  bio?: { value: string };
  birth_date?: string;
  death_date?: string;
}

export async function fetchAuthorsBy(props: {
  bookAuthors: Map<string, string[]>;
  workAuthors: Map<string, string[]>;
}): Promise<void> {
  const authorMapping = new Map<string, string>();
  const authors = new Set<string>();

  for (const list of props.bookAuthors.values()) {
    for (const author of list) {
      authors.add(author);
    }
  }

  for (const list of props.workAuthors.values()) {
    for (const author of list) {
      authors.add(author);
    }
  }

  await downloadDump<AuthorOpenLibraryImpl, Author | null>({
    name: "authors",
    inputURL: "https://openlibrary.org/data/ol_dump_authors_latest.txt.gz",
    outputPath: "data/authors.jsonl",
    parse: (line: string): AuthorOpenLibraryImpl => {
      const columns = line.split("\t");
      const ref = columns[1];
      const raw_json = columns[4];
      const {
        name,
        bio,
        birth_date,
        death_date
      } = JSON.parse(raw_json);

      return {
        ref,
        name,
        bio,
        birth_date,
        death_date
      };
    },
    adapt: (obj: AuthorOpenLibraryImpl): Author | null => {
      const author = new Author();
      author.name = obj.name ? obj.name.slice(0, 255) : "";
      author.biography = obj.bio ? obj.bio.value : "";
      author.birthDate = obj.birth_date ? parseDate(obj.birth_date) : null;
      author.deathDate = obj.death_date ? parseDate(obj.death_date) : null;

      if (author.name && authors.has(obj.ref)) {
        authorMapping.set(obj.ref, author.ID);
        return author;
      }

      else return null;
    }
  });

  fs.writeFile(
    path.resolve(__dirname, "data/author_mapping.csv"),
    Array.from(authorMapping).join("\n")
  );
}

function parseDate(input: string): Date | null {
  if (!input) return null;
  const formats = ['yyyy-MM-dd', 'yyyy-MM', 'yyyy'];
  for (const format of formats) {
    const date = parse(input, format, new Date());
    if (isValid(date)) return date;
  }
  return null;
}
