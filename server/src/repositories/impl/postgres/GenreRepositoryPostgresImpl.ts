import { GenreRepository } from "@/repositories/GenreRepository";
import { Genre } from "@/domain/Genre";
import { Client } from "pg";

export interface GenreRecord {
  name: string;
  display_name: string;
}

export class GenreRepositoryPostgresImpl implements GenreRepository {
  constructor(private client: Client) {}

  public async find(name: string): Promise<Genre | null> {
    const result = await this.client.query("SELECT * FROM genre WHERE name = $1;", [name]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(genre: Genre): Promise<void> {
    const result = await this.client.query("SELECT * FROM genre WHERE name = $1;", [genre.name]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE genre SET display_name = $2 WHERE name = $1;",
        [genre.name, genre.displayName]
      );
    } else {
      await this.client.query(
        "INSERT INTO genre (name, display_name) VALUES ($1, $2);",
        [genre.name, genre.displayName]
      );
    }
  }

  private deserialize(record: GenreRecord): Genre {
    const genre = new Genre();
    genre.displayName = record.display_name;
    return genre;
  }
}
