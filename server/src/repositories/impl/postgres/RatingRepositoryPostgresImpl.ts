import { RatingRepository } from "@/repositories/RatingRepository";
import { Rating } from "@/domain/Rating";
import { Client } from "pg";

export interface RatingRecord {
  id: string;
  account_id: string;
  work_id: string;
  book_isbn: string | null;
  score: number;
  created_at: string;
}

export class RatingRepositoryPostgresImpl implements RatingRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<Rating | null> {
    const result = await this.client.query("SELECT * FROM rating WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(rating: Rating): Promise<void> {
    const result = await this.client.query("SELECT * FROM rating WHERE id = $1;", [rating.ID]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE rating SET score = $2 WHERE id = $1;",
        [rating.ID, rating.score]
      );
    } else {
      await this.client.query(
        "INSERT INTO rating (id, account_id, work_id, book_isbn, score, created_at) VALUES ($1, $2, $3, $4, $5, $6);",
        [rating.ID, rating.accountID, rating.workID, rating.bookISBN, rating.score, rating.createdAt]
      );
    }
  }

  private deserialize(record: RatingRecord): Rating {
    const rating = new Rating(record.id, Number(record.created_at));
    rating.accountID = record.account_id
    rating.workID = record.work_id;
    rating.bookISBN = record.book_isbn;
    rating.score = record.score;
    return rating;
  }
}
