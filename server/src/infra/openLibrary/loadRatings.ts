import { Rating } from "../../domain/Rating";
import { loadJSONL } from "./loadJSONL";
import { recordsTemplate } from "../pg/templates";
import { client } from "../pg/connection";

export function loadRatings(): Promise<void> {
  return loadJSONL<Rating>({
    relativePath: "data/ratings.jsonl",
    store: async (ratings: Rating[]) => {
      let ratingProps = [];
      for (const rating of ratings) {
        ratingProps.push(
          rating.ID,
          rating.accountID,
          rating.workID,
          rating.bookISBN,
          rating.score,
          rating.createdAt
        );
      }

      let template = recordsTemplate({
        numberOfRecords: ratingProps.length / 6,
        sizeOfRecord: 6,
        casting: ["uuid", "uuid", "uuid", "varchar", "int", "int"]
      });

      await client.query(
        `INSERT INTO rating (id, account_id, work_id, book_isbn, score, created_at) VALUES ${template};`,
        ratingProps
      );
    }
  });
}
