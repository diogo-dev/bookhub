import { Reservation } from "@/domain/Reservation";
import { ReservationBookDTO } from "@/dto/ReservationBookDTO";
import { ReservationRepository } from "@/repositories/ReservationRepository";
import { Client } from "pg";

export interface ReservationRecord {
    id: string;
    code: string;
    user_id: string;
    item_id: string;
    start_at: string;
    end_at: string;
    created_at: string;
}

function formatDateFromBigint(value: string | number): string {
    const date = new Date(Number(value));

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

export class ReservationRepositoryPostgresImpl implements ReservationRepository {

    constructor(private client: Client) {}

    public async save(reservation: Reservation): Promise<Reservation> { 
        await this.client.query("BEGIN;");
        try { 
            await this.client.query(
                `INSERT INTO reservation(id, code, user_id, item_id, start_at, end_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, user_id = EXCLUDED.user_id, item_id = EXCLUDED.item_id, start_at = EXCLUDED.start_at, end_at = EXCLUDED.end_at;`,
                [reservation.ID, reservation.code, reservation.userID, reservation.itemID, reservation.startAt, reservation.endAt, reservation.createdAt]
            );

            await this.client.query("COMMIT;");
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }

        return reservation;
    }

    public async findById(id: string): Promise<Reservation | null> {
        const result = await this.client.query(
            `SELECT * FROM reservation WHERE id = $1;`,
            [id]
        );

        if (result.rows.length === 0) return null;
        return await this.deserialize(result.rows[0]);
    }

    public async findByUserId(userId: string): Promise<Reservation[]> {

        const result = await this.client.query(
            `SELECT * FROM reservation WHERE user_id = $1;`,
            [userId]
        );

        if (result.rows.length === 0) return [];
        return Promise.all(result.rows.map((row) => this.deserialize(row)));
    }

    public async findReservationListByUser(userId: string): Promise<ReservationBookDTO[]> {
        const result = await this.client.query(`
            SELECT 
                r.id AS reservation_id,
                r.start_at,
                r.end_at,
                bi.status AS item_status,
                b.title AS book_title,
                b.isbn AS book_isbn,
                a.name AS author_name
            FROM reservation r
            JOIN book_item bi ON bi.id = r.item_id
            JOIN book b ON b.isbn = bi.isbn
            JOIN book_author ba ON ba.book_isbn = b.isbn
            JOIN author a ON a.id = ba.author_id
            WHERE r.user_id = $1
            ORDER BY r.start_at DESC
        `, [userId]);

        if (result.rowCount === 0) {
            return [];
        }

        // Agrupar por reservation_id (porque vem 1 linha por autor)
        const map = new Map<number, ReservationBookDTO>();

        for (const row of result.rows) {
            const id = row.reservation_id;

            if (!map.has(id)) {
                map.set(id, {
                    reservationId: row.reservation_id,
                    startAt: formatDateFromBigint(row.start_at),
                    endAt: formatDateFromBigint(row.end_at),
                    itemStatus: row.item_status,
                    bookTitle: row.book_title,
                    bookIsbn: row.book_isbn,
                    authors: []
                });
            }

            // Add autor ao array
            const entry = map.get(id)!;
            entry.authors.push(row.author_name);
        }

        // Retornar como lista
        return Array.from(map.values());
    }

    public async findByItemId(itemId: string): Promise<Reservation[]> {

        const result = await this.client.query(
            `SELECT * FROM reservation WHERE item_id = $1;`,
            [itemId]
        );

        if (result.rows.length === 0) return [];
        return Promise.all(result.rows.map((row) => this.deserialize(row)));
    }

    public async remove(reservation: Reservation): Promise<void> { 
        await this.client.query(
            `DELETE FROM reservation WHERE id = $1;`,
            [reservation.ID]
        );
    }
    
    public async listAll(): Promise<Reservation[]> {
        const result = await this.client.query(
            `SELECT * FROM reservation;`
        );
        if (result.rows.length === 0) return [];
        return Promise.all(result.rows.map((row) => this.deserialize(row)));
    }

    private async deserialize(record: ReservationRecord): Promise<Reservation> {
        return new Reservation(
            record.id, 
            record.code, 
            record.user_id, 
            record.item_id, 
            Number(record.start_at), 
            Number(record.end_at), 
            Number(record.created_at)
        );
    }
}
