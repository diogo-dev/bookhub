import { CategoryRepository } from "@/repositories/CategoryRepository";
import { DeweyCategory } from "@/domain/DeweyCategory";
import { Client } from "pg";

export interface DeweyCategoryRecord {
  id: string;
  parent_id: string;
  decimal: string;
  level: number;
  name: string;
  created_at: string;
}

export class CategoryRepositoryPostgresImpl implements CategoryRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<DeweyCategory | null> {
    const result = await this.client.query("SELECT * FROM dewey_category WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async findAll(): Promise<DeweyCategory[]> {
    const result = await this.client.query<DeweyCategoryRecord>("SELECT * FROM dewey_category ORDER BY decimal;");
    return result.rows.map(record => this.deserialize(record));
  }

  public async findHierarchy(decimal: string): Promise<DeweyCategory[]> {
    if (!decimal) return [];

    const result = await this.client.query<DeweyCategoryRecord>(`
        SELECT * FROM dewey_category
        WHERE
          decimal = $1 AND level = 0 OR
          decimal = $2 AND level = 1 OR
          decimal = $3 AND level = 2
        ORDER BY level;`,
      [decimal[0] + "00", decimal[0] + decimal[1] + "0", decimal]
    );

    return result.rows.map(this.deserialize);
  }

  public async save(category: DeweyCategory): Promise<void> {
    const result = await this.client.query(
      "SELECT * FROM dewey_category WHERE id = $1;",
      [category.ID]
    );

    const recordExists = result.rows.length > 0;
    if (recordExists) {
      await this.client.query(
        "UPDATE dewey_category SET parent_id = $2, decimal = $3, level = $4, name = $5, WHERE id = $1;",
        [category.ID, category.parentID, category.decimal, category.level, category.name]
      );
    } else {
      await this.client.query(
        "INSERT INTO dewey_category (id, parent_id, decimal, level, name, created_at) VALUES ($1, $2, $3, $4, $5, $6);",
        [category.ID, category.parentID, category.decimal, category.level, category.name, category.createdAt]
      );
    }
  }

  private deserialize(record: DeweyCategoryRecord): DeweyCategory {
    const category = new DeweyCategory(record.id, Number(record.created_at));
    category.parentID = record.parent_id;
    category.decimal = record.decimal;
    category.level = record.level;
    category.name = record.name;
    return category;
  }
}
