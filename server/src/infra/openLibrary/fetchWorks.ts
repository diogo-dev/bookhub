import fs from "fs/promises";
import path from "path";
import striptags from "striptags";
import { WorkDTO } from "@/domain/WorkDTO";
import { downloadDump } from "./downloadDump";

interface WorkOpenLibraryImpl {
  ref: string;
  title?: string;
  subtitle?: string;
  description?: { value: string };
  authors?: {
    author?: {
      key: string;
    }
  }[]
}

export async function fetchWorksBy(refs: Set<string>): Promise<{
  workAuthors: Map<string, string[]>;
}> {
  const workMapping = new Map<string, string>();
  const workAuthors = new Map<string, string[]>();

  await downloadDump<WorkOpenLibraryImpl, WorkDTO | null>({
    name: "works",
    inputURL: "https://openlibrary.org/data/ol_dump_works_latest.txt.gz",
    outputPath: "data/works.jsonl",
    parse: (line: string): WorkOpenLibraryImpl => {
      const columns = line.split("\t");
      const ref = columns[1];
      const raw_json = columns[4];
      const {
        title,
        subtitle,
        description,
        authors
      } = JSON.parse(raw_json);

      return {
        ref,
        title,
        subtitle,
        description,
        authors
      };
    },
    adapt: (obj: WorkOpenLibraryImpl): WorkDTO | null => {
      const work: WorkDTO = {
        ID: crypto.randomUUID(),
        title: obj.title ? obj.title.slice(0, 255) : "",
        subtitle: obj.subtitle ? obj.subtitle.slice(0, 255) : "",
        description: obj.description ? striptags(obj.description.value) : "",
        authors: obj.authors
          ? obj.authors.map(a => a.author?.key).filter(a => a != undefined)
          : [],
        editions: [],
        createdAt: Date.now()
      };

      if (work.title && refs.has(obj.ref)) {
        workMapping.set(obj.ref, work.ID);
        workAuthors.set(work.ID, work.authors);
        return work;
      }

      else return null;
    }
  });

  fs.writeFile(
    path.resolve(__dirname, "data/work_mapping.csv"),
    Array.from(workMapping).join("\n")
  );

  return { workAuthors };
}
