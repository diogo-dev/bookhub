import { Loan } from "@/domain/Loan";
import { LoanRepository } from "@/repositories/loanRepository";
import { Client } from "pg";

export interface LoanRecord {
    id: string;
    code: string;
    user_id: string;
    item_id: string;
    start_at: number;
    due_at: number;
    reservation_id: string | null;
    returned_at: number | null;
    status: "ativo" | "devolvido" | "atrasado";
    created_at: number;
}

export class LoanRepositoryPostgresImpl implements LoanRepository {
    constructor(private client: Client) {}

    public async save(loan: Loan): Promise<Loan> { 
        await this.client.query("BEGIN;");
        try { 
            await this.client.query(
                `INSERT INTO loan(id, code , user_id, item_id, start_at, due_at, reservation_id, returned_at, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, user_id = EXCLUDED.user_id, item_id = EXCLUDED.item_id, start_at = EXCLUDED.start_at, due_at = EXCLUDED.due_at, reservation_id = EXCLUDED.reservation_id, returned_at = EXCLUDED.returned_at, status = EXCLUDED.status;`,
                [loan.ID, loan.code, loan.userID, loan.itemID, loan.startAt, loan.dueAt, loan.reservationID, loan.returnedAt, loan.status, loan.createdAt]
            );

            await this.client.query("COMMIT;");
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }

        return loan;
    }

    public async findById(id: string): Promise<Loan | null> {
        const result = await this.client.query(
            `SELECT * FROM loan WHERE id = $1;`,
            [id]
        );
        if (result.rows.length === 0) return null;
        return await this.deserialize(result.rows[0]);
    }

    public async findByCode(code: string): Promise<Loan | null> {
        const result = await this.client.query(
            `SELECT * FROM loan WHERE code = $1;`,
            [code]
        );
        if (result.rows.length === 0) return null;
        return await this.deserialize(result.rows[0]);
    }

    public async findByUserId(userId: string): Promise<Loan[]> {
        const result = await this.client.query(
            `SELECT * FROM loan WHERE user_id = $1;`,
            [userId]
        );
        if (result.rows.length === 0) return [];
        return Promise.all(result.rows.map((row) => this.deserialize(row)));
    }

    public async findByItemId(itemId: string): Promise<Loan[]> {
        const result = await this.client.query(
            `SELECT * FROM loan WHERE item_id = $1;`,
            [itemId]
        );
        if (result.rows.length === 0) return [];
        return Promise.all(result.rows.map((row) => this.deserialize(row)));
    }

    public async updateStatus(id: string, status: Loan['status'], returnedAt?: number): Promise<void> {

        await this.client.query("BEGIN;");
        try { 
            await this.client.query(
                `UPDATE loan SET status = $1, returned_at = $2 WHERE id = $3;`,
                [status, returnedAt || null, id]
            );
            await this.client.query("COMMIT;");
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }
    }

    private async deserialize(record: LoanRecord): Promise<Loan> {
        return new Loan(
            record.user_id, 
            record.item_id, 
            Number(record.start_at), 
            Number(record.due_at), 
            record.reservation_id, 
            record.code, 
            record.id, 
            record.returned_at ? Number(record.returned_at) : null, 
            record.status, 
            Number(record.created_at)
        );
    }
}