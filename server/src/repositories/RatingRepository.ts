import { Rating } from "@/domain/Rating";

export interface RatingRepository {
  save(rating: Rating): Promise<void>;
  find(id: string): Promise<Rating | null>;
}
