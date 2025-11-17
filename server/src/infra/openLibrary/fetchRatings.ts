import { Rating } from "../../domain/Rating";
import { downloadDump } from "./downloadDump";

interface RatingOpenLibraryImpl {
  work_ref: string;
  book_ref: string;
  score: string;
  date: string;
}

export function fetchRatingsBy(props: {
  bookRefs: Set<string>;
  workRefs: Set<string>;
}): Promise<void> {
  return downloadDump<RatingOpenLibraryImpl, Rating | null>({
    name: "ratings",
    inputURL: "https://openlibrary.org/data/ol_dump_ratings_latest.txt.gz",
    outputPath: "data/ratings.jsonl",
    parse: (line: string): RatingOpenLibraryImpl => {
      const [
        work_ref,
        book_ref,
        score,
        date
      ] = line.split("\t");

      return {
        work_ref,
        book_ref,
        score,
        date
      };
    },
    adapt: (obj: RatingOpenLibraryImpl): Rating | null => {
      const rating = new Rating();
      rating.accountID = null;
      rating.workID = obj.work_ref;
      rating.bookISBN = obj.book_ref || null;
      rating.score = Number(obj.score);
      rating.createdAt = new Date(obj.date).getTime();

      if (
        props.workRefs.has(obj.work_ref) ||
        props.bookRefs.has(obj.book_ref)
      ) return rating;
      else return null;
    }
  });
}
