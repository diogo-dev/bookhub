import { Author } from "../../domain/Author";
import { loadJSONL } from "./loadJSONL";
import { recordsTemplate } from "../pg/templates";
import { client } from "../pg/connection";

export function loadAuthors(): Promise<void> {
  return loadJSONL<Author>({
    relativePath: "data/authors.jsonl",
    store: async (authors: Author[]) => {
      let authorProps = [];
      for (const author of authors) {
        authorProps.push(
          author.ID,
          author.name,
          author.biography || "",
          author.birthDate,
          author.deathDate,
          author.createdAt
        );
      }

      let template = recordsTemplate({
        numberOfRecords: authorProps.length / 6,
        sizeOfRecord: 6,
        casting: ["uuid", "varchar", "text", "date", "date", "bigint"]
      });

      await client.query(
        `INSERT INTO author (id, name, biography, birth_date, death_date, created_at) VALUES ${template} ON CONFLICT (id) DO NOTHING;`,
        authorProps
      );
    }
  });
}
