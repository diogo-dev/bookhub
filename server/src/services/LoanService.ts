import { ItemRepository } from "@/repositories/ItemRepository";
import { ReservationRepository } from "@/repositories/ReservationRepository";
import { Client } from "pg";
import { LoanRepository } from "@/repositories/loanRepository";
import { Reservation } from "@/domain/Reservation";
import { HttpError } from "@/errors/HttpError";
import { Loan } from "@/domain/Loan";
import { LoanBookDTO } from "@/dto/LoanBookDTO";
import { BookItem } from "@/domain/BookItem";

export class LoanService { 
    constructor(
        private loanRepository: LoanRepository,
        private reservationRepository: ReservationRepository,
        private itemRepository: ItemRepository,
        private client: Client
    ) {}

    async createLoan(userID: string, itemID: string, startAt: number, dueAt: number, reservationID?: string): Promise<Loan> {
        const item = await this.itemRepository.find(itemID);
        if (!item) throw new HttpError(404, "Item not found");

        let reservation: Reservation | null = null;
        if (reservationID) {
            reservation = await this.reservationRepository.findById(reservationID);
            if (!reservation) throw new HttpError(404, "Reserva não encontrada");
            if (reservation.userID !== userID) throw new HttpError(400, "Reserva não pertence ao usuário");
            if (reservation.itemID !== itemID) throw new HttpError(400, "Reserva não pertence a este item");
        }

        const itemStatus = await this.getItemStatus(itemID);
        if (itemStatus === "emprestado") throw new HttpError(400, "Exemplar já está emprestado");

        const activeLoans = await this.loanRepository.findByUserIdAndBookIsbn(userID, item.ISBN);
        const hasActiveLoan = activeLoans.some(
            l => l.status === 'ativo' && !l.returnedAt
        );
        if (hasActiveLoan) throw new HttpError(400, "Exemplar já está emprestado para este usuário");

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

    async returnLoanAndItem(loanID: string): Promise<{loan: Loan, item: BookItem}> {
        const loan = await this.loanRepository.findById(loanID);
        if (!loan) throw new HttpError(404, "Empréstimo não encontrado");
        if (loan.status !== "ativo") throw new HttpError(400, "Empréstimo não ativo");
        if (loan.returnedAt) throw new HttpError(400, "Empréstimo já devolvido");

        await this.client.query("BEGIN;");
        try { 
            loan.markAsReturned();
            await this.loanRepository.updateStatus(loanID, "devolvido", loan.returnedAt!);
            const item = await this.itemRepository.updateStatus(loan.itemID, "disponivel");
            await this.client.query("COMMIT;");
            return {loan, item};
        } catch (error) { 
            await this.client.query("ROLLBACK;");
            throw error;
        }
    }

    async getUserLoans(userID: string): Promise<Loan[]> {
        return await this.loanRepository.findByUserId(userID);
    }

    async getUserLoansAndBookInfo(userID: string): Promise<LoanBookDTO[]> {
        return await this.loanRepository.findLoanListByUser(userID);
    }

    private async getItemStatus(itemID: string): Promise<"disponivel" | "emprestado" | "indisponivel" | "reservado"> {
        const result = await this.client.query(
            "SELECT status FROM book_item WHERE id = $1;",
            [itemID]
        );
        if (result.rows.length === 0) throw new HttpError(404, "Exemplar não encontrado");
        return result.rows[0].status as "disponivel" | "emprestado" | "indisponivel" | "reservado";
    }
}