import { AuthorRepository } from "@/repositories/AuthorRepository";
import { Author } from "@/domain/Author";
import { Client } from "pg";

export interface AuthorRecord {
  id: string;
  name: string;
  biography: string;
  birth_date: string;
  death_date: string | null;
  created_at: number;
}

export class AuthorRepositoryPostgresImpl implements AuthorRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<Author | null> {
    const result = await this.client.query("SELECT * FROM author WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(author: Author): Promise<void> {
    const result = await this.client.query("SELECT * FROM author WHERE id = $1;", [author.ID]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE author SET name = $2, biography = $3, birth_date = $4, death_date = $5 WHERE id = $1;",
        [author.ID, author.name, author.biography, author.birthDate, author.deathDate]
      );
    } else {
      await this.client.query(
        "INSERT INTO author (id, name, biography, birth_date, death_date, created_at) VALUES ($1, $2, $3, $4, $5, $6);",
        [author.ID, author.name, author.biography, author.birthDate, author.deathDate, author.createdAt]
      );
    }
  }

  private deserialize(record: AuthorRecord): Author {
    const author = new Author(record.id, record.created_at);
    author.name = record.name;
    author.biography = record.biography;
    author.birthDate = new Date(record.birth_date);
    author.deathDate = record.death_date ? new Date(record.death_date) : null;
    return author;
  }
}
