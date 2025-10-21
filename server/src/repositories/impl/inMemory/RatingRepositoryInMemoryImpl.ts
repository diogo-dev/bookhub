import { RatingRepository } from "@/repositories/RatingRepository";
import { Rating } from "@/domain/Rating";

export class RatingRepositoryInMemoryImpl implements RatingRepository {
  private ratings: Map<string, Rating> = new Map();

  public async find(id: string): Promise<Rating | null> {
    return this.ratings.get(id) || null;
  }

  public async save(rating: Rating): Promise<void> {
    this.ratings.set(rating.ID, rating);
  }
}
