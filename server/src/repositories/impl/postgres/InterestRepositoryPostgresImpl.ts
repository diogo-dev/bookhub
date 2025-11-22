import { InterestItem } from "@/domain/InterestItem";
import { InterestItemRepository } from "@/repositories/InterestItemRepository";
import { Client } from "pg";

export interface InterestItemRecord {
    user_id: string;
    book_isbn: string;
    created_at: string;
}

export class InterestRepositoryPostgresImpl implements InterestItemRepository {

    constructor(private client: Client) {}

    public async save(interestItem: InterestItem): Promise<InterestItem> {

        await this.client.query("BEGIN;");
        try { 
            await this.client.query(
                `INSERT INTO user_interest(user_id, book_isbn, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;`,
                [interestItem.userID, interestItem.bookISBN, interestItem.createdAt]                
            );

            await this.client.query("COMMIT;");
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }

        return interestItem;
    }

    public async findByUserId(userId: string): Promise<InterestItem[]> {
        const result = await this.client.query(
            `SELECT * FROM user_interest WHERE user_id = $1;`,
            [userId]
        );

        if (result.rows.length === 0) return [];
        return Promise.all(result.rows.map((row) => this.deserialize(row)));
    }

    public async findByUserAndBookISBN(userId: string, bookISBN: string): Promise<InterestItem | null> {
        const result = await this.client.query(
            `SELECT * FROM user_interest WHERE user_id = $1 AND book_isbn = $2;`,
            [userId, bookISBN]
        );

        if (result.rows.length === 0) return null;
        return await this.deserialize(result.rows[0]);
    }

    public async remove(userId: string, bookISBN: string): Promise<void> { 
        await this.client.query(
            `DELETE FROM user_interest WHERE user_id = $1 AND book_isbn = $2;`,
            [userId, bookISBN]
        );
    }

    private async deserialize(record: InterestItemRecord): Promise<InterestItem> {
        return new InterestItem(record.user_id, record.book_isbn, Number(record.created_at));
    }
}