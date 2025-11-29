import { WorkDTO } from "@/domain/WorkDTO";
import { loadJSONL } from "./loadJSONL";
import { recordsTemplate } from "../pg/templates";
import { client } from "../pg/connection";

export async function loadWorks(params: {
  authorMapping: Map<string, string>;
}) {
  await loadJSONL<WorkDTO>({
    relativePath: "data/works.jsonl",
    store: async (works: WorkDTO[]) => {
      const workProps = [];
      const workAuthors = [];
      for (const work of works) {
        workProps.push(
          work.ID,
          work.title,
          work.subtitle,
          work.description,
          work.createdAt
        );

        for (const authorRef of work.authors) {
          const authorID = params.authorMapping.get(authorRef);
          if (authorID) workAuthors.push(work.ID, authorID);
        }
      }

      let template = recordsTemplate({
        numberOfRecords: workProps.length / 5,
        sizeOfRecord: 5,
        casting: ["uuid", "varchar", "varchar", "text", "bigint"]
      });

      await client.query(
        `INSERT INTO work (id, title, subtitle, description, created_at) VALUES ${template} ON CONFLICT (id) DO NOTHING;`,
        workProps
      );

      template = recordsTemplate({
        numberOfRecords: workAuthors.length / 2,
        sizeOfRecord: 2,
        casting: ["uuid", "uuid"]
      });

      await client.query(
        `INSERT INTO work_author (work_id, author_id) VALUES ${template} ON CONFLICT DO NOTHING;`,
        workAuthors
      );
    }
  });
}
