import { Author } from "@/domain/Author";
import { AuthorRepository } from "@/repositories/AuthorRepository";
import { HttpError } from "@/errors/HttpError";
import { FindOrCreateResult } from "@/services/LanguageService";

export interface CreateAuthorData {
  name: string;
  biography?: string;
  birthDate?: Date;
  deathDate?: Date;
}

export class AuthorService {
  constructor(private authorRepository: AuthorRepository) {}

  async getById(id: string): Promise<Author> {
    const author = await this.authorRepository.find(id);
    if (!author) throw new HttpError(404, "author not found");
    return author;
  }

  async listAll(): Promise<Author[]> {
    return this.authorRepository.findAll();
  }

  async findOrCreate(data: CreateAuthorData): Promise<FindOrCreateResult<Author>> {
    const existing = await this.authorRepository.findByName(data.name);
    if (existing) return { entity: existing, created: false };

    const author = new Author();
    author.name = data.name;
    author.biography = data.biography || "";
    author.birthDate = data.birthDate || null;
    author.deathDate = data.deathDate || null;

    await this.authorRepository.save(author);
    return { entity: author, created: true };
  }
}
