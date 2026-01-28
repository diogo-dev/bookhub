import { ItemRepository } from "@/repositories/ItemRepository";
import { BookItem } from "@/domain/BookItem";

export class ItemRepositoryInMemoryImpl implements ItemRepository {
  private items: Map<string, BookItem> = new Map();

  public async find(id: string): Promise<BookItem | null> {
    return this.items.get(id) || null;
  }

  public async findByISBN(ISBN: string): Promise<BookItem[]> {
    return Array.from(this.items.values()).filter(item => item.ISBN == ISBN);
  }

  public async save(item: BookItem): Promise<void> {
    this.items.set(item.ID, item);
  }

  updateStatus(itemId: string, status: "disponivel" | "emprestado" | "indisponivel" | "reservado"): Promise<BookItem> {
    throw new Error("Method not implemented.");
  }
}
