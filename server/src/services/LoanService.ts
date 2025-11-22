import { ItemRepository } from "@/repositories/ItemRepository";
import { ReservationRepository } from "@/repositories/ReservationRepository";
import { Client } from "pg";
import { LoanRepository } from "@/repositories/loanRepository";
import { Reservation } from "@/domain/Reservation";
import { Loan } from "@/domain/Loan";

export class LoanService { 
    constructor(
        private loanRepository: LoanRepository,
        private reservationRepository: ReservationRepository,
        private itemRepository: ItemRepository,
        private client: Client
    ) {}

    async createReservation(userID: string, itemID: string, startAt: number, endAt: number): Promise<Reservation> {

        const item = await this.itemRepository.find(itemID);
        if (!item) throw new Error("Exemplar não encontrado");

        const itemStatus = await this.getItemStatus(itemID);
        if (itemStatus !== "disponivel") throw new Error("Exemplar não disponível");

        const activeReservations = await this.reservationRepository.findByUserId(userID);
        const now = Date.now();
        const hasActiveReservation = activeReservations.some(r => r.startAt <= now && r.endAt >= now);

        if (hasActiveReservation) throw new Error("Usuário já tem uma reserva ativa");

        await this.client.query("BEGIN;");
        try { 
            const reservation = new Reservation(
                crypto.randomUUID(),
                "",
                userID,
                itemID,
                startAt,
                endAt,
                Date.now()
            )

            await this.reservationRepository.save(reservation);
            await this.itemRepository.updateStatus(itemID, "reservado");
            await this.client.query("COMMIT;");
            return reservation;
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }
    }

    async createLoan(userID: string, itemID: string, startAt: number, dueAt: number, reservationID?: string): Promise<Loan> {
        const item = await this.itemRepository.find(itemID);
        if (!item) throw new Error("Item not found");

        let reservation: Reservation | null = null;
        if (reservationID) {
            reservation = await this.reservationRepository.findById(reservationID);
            if (!reservation) throw new Error("Reserva não encontrada");
            if (reservation.userID !== userID) throw new Error("Reserva não pertence ao usuário");
            if (reservation.itemID !== itemID) throw new Error("Reserva não pertence a este item");
        }

        const itemStatus = await this.getItemStatus(itemID);
        if (itemStatus === "emprestado") throw new Error("Exemplar já está emprestado");

        const activeLoans = await this.loanRepository.findByUserId(userID);
        const hasActiveLoan = activeLoans.some(
            l => l.status === 'ativo' && !l.returnedAt
        );
        if (hasActiveLoan) throw new Error("Exemplar já está emprestado");

        await this.client.query("BEGIN;");
        try { 
            const loan = new Loan(
                userID,
                itemID,
                startAt,
                dueAt,
                reservationID || null,
                undefined,
                undefined,
                null,
                "ativo",
                Date.now()
            )

            await this.loanRepository.save(loan);
            await this.itemRepository.updateStatus(itemID, "emprestado");
            await this.client.query("COMMIT;");
            return loan;
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }
    }

    async returnLoan(loanID: string): Promise<Loan> {
        const loan = await this.loanRepository.findById(loanID);
        if (!loan) throw new Error("Empréstimo não encontrado");
        if (loan.status !== "ativo") throw new Error("Empréstimo não ativo");
        if (loan.returnedAt) throw new Error("Empréstimo já devolvido");

        await this.client.query("BEGIN;");
        try { 
            loan.markAsReturned();
        await this.loanRepository.updateStatus(loanID, "devolvido", loan.returnedAt!);
        await this.itemRepository.updateStatus(loan.itemID, "disponivel");

        await this.client.query("COMMIT;");
        return loan;
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }
    }

    async getUserLoans(userID: string): Promise<Loan[]> {
        return await this.loanRepository.findByUserId(userID);
    }

    private async getItemStatus(itemID: string): Promise<"disponivel" | "emprestado" | "indisponivel" | "reservado"> {
        const result = await this.client.query(
            "SELECT status FROM book_item WHERE id = $1;",
            [itemID]
        );
        if (result.rows.length === 0) throw new Error("Exemplar não encontrado");
        return result.rows[0].status as "disponivel" | "emprestado" | "indisponivel" | "reservado";
    }
}