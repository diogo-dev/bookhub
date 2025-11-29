import { Rating } from "../../domain/Rating";
import { loadJSONL } from "./loadJSONL";
import { recordsTemplate } from "../pg/templates";
import { client } from "../pg/connection";

export function loadRatings(params: {
  bookMapping: Map<string, string>;
  workMapping: Map<string, string>;
}) {
  return loadJSONL<Rating>({
    relativePath: "data/ratings.jsonl",
    store: async (ratings: Rating[]) => {
      let ratingProps = [];
      for (const rating of ratings) {
        ratingProps.push(
          rating.ID,
          rating.accountID,
          rating.workID ? params.workMapping.get(rating.workID) : null,
          rating.bookISBN ? params.bookMapping.get(rating.bookISBN) : null,
          rating.score,
          rating.createdAt
        );
      }

      let template = recordsTemplate({
        numberOfRecords: ratingProps.length / 6,
        sizeOfRecord: 6,
        casting: ["uuid", "uuid", "uuid", "varchar", "int", "bigint"]
      });

      await client.query(
        `INSERT INTO rating (id, account_id, work_id, book_isbn, score, created_at) VALUES ${template} ON CONFLICT (id) DO NOTHING;`,
        ratingProps
      );
    }
  });
}
