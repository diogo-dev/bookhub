import { BookItem } from "@/domain/BookItem";

export interface ItemRepository {
  save(item: BookItem): Promise<void>;
  find(id: string): Promise<BookItem | null>;
  findByISBN(ISBN: string): Promise<BookItem[]>;
}
