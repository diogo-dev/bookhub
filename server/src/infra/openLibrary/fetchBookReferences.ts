import { fetchDump } from "./fetchDump";

export async function fetchBookReferences(params: { limit?: number }) {
  const bookRefs = new Set<string>();
  const workRefs = new Set<string>();

  const inputStream = await fetchDump("https://openlibrary.org/data/ol_dump_ratings_latest.txt.gz");

  let count = 0;
  for await (const record of inputStream) {
    const [workRef, bookRef] = record.split("\t");

    if (bookRef) {
      bookRefs.add(bookRef);
      workRefs.add(workRef);
      count++;
    }

    if (
      params.limit &&
      params.limit <= count
    ) break;
  }

  return { bookRefs, workRefs };
}
