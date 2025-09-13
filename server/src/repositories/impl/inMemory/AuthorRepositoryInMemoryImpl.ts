import { AuthorRepository } from "@/repositories/AuthorRepository";
import { Author } from "@/domain/Author";

export class AuthorRepositoryInMemoryImpl implements AuthorRepository {
  private authors: Map<string, Author> = new Map();

  public async find(id: string): Promise<Author | null> {
    return this.authors.get(id) || null;
  }

  public async save(author: Author): Promise<void> {
    this.authors.set(author.ID, author);
  }
}
