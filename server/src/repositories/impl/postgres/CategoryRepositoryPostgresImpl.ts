import { CategoryRepository } from "@/repositories/CategoryRepository";
import { DeweyCategory } from "@/domain/DeweyCategory";
import { Client } from "pg";

export interface DeweyCategoryRecord {
  id: string;
  parent_id: string;
  decimal: string;
  name: string;
  description: string;
  created_at: string;
}

export class CategoryRepositoryPostgresImpl implements CategoryRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<DeweyCategory | null> {
    const result = await this.client.query("SELECT * FROM dewey_category WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(category: DeweyCategory): Promise<void> {
    const result = await this.client.query("SELECT * FROM dewey_category WHERE id = $1;", [category.ID]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE dewey_category SET parent_id = $2, decimal = $3, name = $4, description = $5 WHERE id = $1;",
        [category.ID, category.parentID, category.decimal, category.name, category.description]
      );
    } else {
      await this.client.query(
        "INSERT INTO dewey_category (id, parent_id, decimal, name, description, created_at) VALUES ($1, $2, $3, $4, $5, $6);",
        [category.ID, category.parentID, category.decimal, category.name, category.description, category.createdAt]
      );
    }
  }

  private deserialize(record: DeweyCategoryRecord): DeweyCategory {
    const category = new DeweyCategory(record.id, Number(record.created_at));
    category.parentID = record.parent_id;
    category.decimal = Number(record.decimal);
    category.name = record.name;
    category.description = record.description;
    return category;
  }
}
