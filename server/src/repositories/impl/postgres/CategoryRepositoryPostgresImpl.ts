import { CategoryRepository, DeweyCategoryTree } from "@/repositories/CategoryRepository";
import { DeweyCategory } from "@/domain/DeweyCategory";
import { Client } from "pg";

export interface DeweyCategoryRecord {
  id: string;
  parent_id: string;
  decimal: string;
  name: string;
  created_at: string;
}

type DeweyCategoryNode = DeweyCategoryRecord & { level: number };

export class CategoryRepositoryPostgresImpl implements CategoryRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<DeweyCategory | null> {
    const result = await this.client.query("SELECT * FROM dewey_category WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async findHierarchy(id: string): Promise<DeweyCategoryTree> {
    const result = await this.client.query<DeweyCategoryNode>(`
      WITH RECURSIVE ancestors AS (
        SELECT *, 0 as level FROM dewey_category
        WHERE id = $1

        UNION ALL

        SELECT c.*, a.level + 1 FROM dewey_category c
        JOIN ancestors a ON c.id = a.parent_id
      )

      SELECT * FROM ancestors ORDER BY level DESC;`,
      [id]
    );

    return this.deserializeTree(result.rows);
  }

  public async save(category: DeweyCategory): Promise<void> {
    const result = await this.client.query("SELECT * FROM dewey_category WHERE id = $1;", [category.ID]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE dewey_category SET parent_id = $2, decimal = $3, name = $4, WHERE id = $1;",
        [category.ID, category.parentID, category.decimal, category.name]
      );
    } else {
      await this.client.query(
        "INSERT INTO dewey_category (id, parent_id, decimal, name, created_at) VALUES ($1, $2, $3, $4, $5);",
        [category.ID, category.parentID, category.decimal, category.name, category.createdAt]
      );
    }
  }

  private deserializeTree(nodes: DeweyCategoryNode[]): DeweyCategoryTree {
    return nodes.map(record => {
      const category = this.deserialize(record);

      return {
        ...category,
        level: record.level
      };
    });
  }

  private deserialize(record: DeweyCategoryRecord): DeweyCategory {
    const category = new DeweyCategory(record.id, Number(record.created_at));
    category.parentID = record.parent_id;
    category.decimal = record.decimal;
    category.name = record.name;
    return category;
  }
}
