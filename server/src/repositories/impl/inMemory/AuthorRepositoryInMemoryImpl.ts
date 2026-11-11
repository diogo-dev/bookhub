import { AuthorRepository } from "@/repositories/AuthorRepository";
import { Author } from "@/domain/Author";

export class AuthorRepositoryInMemoryImpl implements AuthorRepository {
  private authors: Map<string, Author> = new Map();

  public async find(id: string): Promise<Author | null> {
    return this.authors.get(id) || null;
  }

  public async findByName(name: string): Promise<Author | null> {
    const lower = name.toLowerCase();
    return [...this.authors.values()].find(a => a.name.toLowerCase() == lower) || null;
  }

  public async findAll(): Promise<Author[]> {
    return [...this.authors.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  public async save(author: Author): Promise<void> {
    this.authors.set(author.ID, author);
  }
}
