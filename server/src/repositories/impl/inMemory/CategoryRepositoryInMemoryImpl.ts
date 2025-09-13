import { CategoryRepository } from "@/repositories/CategoryRepository";
import { DeweyCategory } from "@/domain/DeweyCategory";

export class CategoryRepositoryInMemoryImpl implements CategoryRepository {
  private categories: Map<string, DeweyCategory> = new Map();

  public async find(id: string): Promise<DeweyCategory | null> {
    return this.categories.get(id) || null;
  }

  public async save(category: DeweyCategory): Promise<void> {
    this.categories.set(category.ID, category);
  }
}
