import { GenreRepository } from "@/repositories/GenreRepository";
import { Genre } from "@/domain/Genre";

export class GenreRepositoryInMemoryImpl implements GenreRepository {
  private genres: Map<string, Genre> = new Map();

  public async find(id: string): Promise<Genre | null> {
    return this.genres.get(id) || null;
  }

  public async save(genre: Genre): Promise<void> {
    this.genres.set(genre.name, genre);
  }
}
