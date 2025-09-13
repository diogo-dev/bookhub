import { ItemRepository } from "@/repositories/ItemRepository";
import { BookItem } from "@/domain/BookItem";

export class ItemRepositoryInMemoryImpl implements ItemRepository {
  private items: Map<string, BookItem> = new Map();

  public async find(id: string): Promise<BookItem | null> {
    return this.items.get(id) || null;
  }

  public async save(item: BookItem): Promise<void> {
    this.items.set(item.ID, item);
  }
}
