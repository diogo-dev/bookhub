import { ItemRepository } from "@/repositories/ItemRepository";
import { BookItem } from "@/domain/BookItem";
import { Client } from "pg";

export interface BookItemRecord {
  id: string;
  isbn: string;
  created_at: string;
  status: "disponivel" | "emprestado" | "indisponivel" | "reservado" | null;
}

export class ItemRepositoryPostgresImpl implements ItemRepository {
  constructor(private client: Client) {}

  public async find(id: string): Promise<BookItem | null> {
    const result = await this.client.query("SELECT * FROM book_item WHERE id = $1;", [id]);

    if (result.rows.length == 0) return null;
    else return this.deserialize(result.rows[0]);
  }

  public async save(item: BookItem): Promise<void> {
    const result = await this.client.query("SELECT * FROM book_item WHERE id = $1;", [item.ID]);
    const recordExists = result.rows.length > 0;

    if (recordExists) {
      await this.client.query(
        "UPDATE book_item SET isbn = $2, status = $3 WHERE id = $1;",
        [item.ID, item.ISBN, item.status]
      );
    } else {
      await this.client.query(
        "INSERT INTO book_item (id, isbn, created_at, status) VALUES ($1, $2, $3, $4);",
        [item.ID, item.ISBN, item.createdAt, item.status]
      );
    }
  }

  public async findByISBN(ISBN: string): Promise<BookItem[]> {
    const result = await this.client.query("SELECT * FROM book_item WHERE isbn = $1;", [ISBN]);
    return result.rows.map(this.deserialize);
  }

  public async updateStatus(itemId: string, status: "disponivel" | "emprestado" | "indisponivel" | "reservado"): Promise<BookItem> {
    const result = await this.client.query(
      "UPDATE book_item SET status = $1 WHERE id = $2 RETURNING *;",
      [status, itemId]
    );

    return this.deserialize(result.rows[0]);
  }

  private deserialize(record: BookItemRecord): BookItem {
    return new BookItem(
      record.isbn, 
      record.id, 
      Number(record.created_at), 
      (record.status || 'disponivel') as "disponivel" | "emprestado" | "indisponivel" | "reservado"
    );
  }
}
