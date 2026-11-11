import { Publisher } from "@/domain/Publisher";
import { PublisherRepository } from "@/repositories/PublisherRepository";
import { Client } from "pg";

export interface PublisherRecord {
  name: string;
  display_name: string;
  created_at: string;
}

export class PublisherRepositoryPostgresImpl implements PublisherRepository {
  constructor(private client: Client) {}

  public async find(name: string): Promise<Publisher | null> {
    const normalizedName = name.toLowerCase().trim();
    const result = await this.client.query("SELECT * FROM publisher WHERE name = $1;", [normalizedName]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async findAll(): Promise<Publisher[]> {
    const result = await this.client.query<PublisherRecord>("SELECT * FROM publisher ORDER BY display_name;");
    return result.rows.map(record => this.deserialize(record));
  }

  public async save(publisher: Publisher): Promise<void> {
    await this.client.query(
      "INSERT INTO publisher (name, display_name, created_at) VALUES ($1, $2, $3);",
      [publisher.name, publisher.displayName, publisher.createdAt]
    );
  }

  private deserialize(record: PublisherRecord): Publisher {
    const publisher = new Publisher(Number(record.created_at));
    publisher.displayName = record.display_name;
    return publisher;
  }
}
