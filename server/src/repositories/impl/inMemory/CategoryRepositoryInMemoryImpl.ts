import { CategoryRepository } from "@/repositories/CategoryRepository";
import { DeweyCategory } from "@/domain/DeweyCategory";

export class CategoryRepositoryInMemoryImpl implements CategoryRepository {
  private categories: Map<string, DeweyCategory> = new Map();

  public async find(id: string): Promise<DeweyCategory | null> {
    return this.categories.get(id) || null;
  }

  public async findAll(): Promise<DeweyCategory[]> {
    return [...this.categories.values()].sort((a, b) => a.decimal.localeCompare(b.decimal));
  }

  public async findHierarchy(decimal: string): Promise<DeweyCategory[]> {
    return this.categories.values().toArray()
      .filter(c => c.decimal == decimal)
      .sort((a, b) => b.level - a.level);
  }

  public async save(category: DeweyCategory): Promise<void> {
    this.categories.set(category.ID, category);
  }
}
