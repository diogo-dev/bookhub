import { Genre } from "@/domain/Genre";

export interface GenreRepository {
  save(genre: Genre): Promise<void>;
  find(name: string): Promise<Genre | null>;
}
