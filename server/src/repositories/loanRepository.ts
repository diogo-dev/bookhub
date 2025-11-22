import { Loan } from "@/domain/Loan";

export interface LoanRepository { 
    save(loan: Loan): Promise<Loan>;
    findById(id: string): Promise <Loan | null>;
    findByCode(code: string): Promise <Loan | null>;
    findByUserId(userId: string): Promise <Loan[]>;
    findByItemId(itemId: string): Promise <Loan[]>;
    updateStatus(id: string, status: Loan['status'], returnedAt?: number): Promise<void>;
}