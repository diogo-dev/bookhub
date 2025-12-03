import { Loan } from "@/domain/Loan";
import { LoanBookDTO } from "@/dto/LoanBookDTO";

export interface LoanRepository { 
    save(loan: Loan): Promise<Loan>;
    findById(id: string): Promise <Loan | null>;
    findByCode(code: string): Promise <Loan | null>;
    findByUserId(userId: string): Promise <Loan[]>;
    findByUserIdAndBookIsbn(userId: string, isbn: string): Promise <Loan[]>;
    findLoanListByUser(userId: string): Promise<LoanBookDTO[]>;
    findByItemId(itemId: string): Promise <Loan[]>;
    updateStatus(id: string, status: Loan['status'], returnedAt?: number): Promise<void>;
}