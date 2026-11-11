import { Author } from "@/domain/Author";

export interface AuthorRepository {
  save(author: Author): Promise<void>;
  find(id: string): Promise<Author | null>;
  findByName(name: string): Promise<Author | null>;
  findAll(): Promise<Author[]>;
}
