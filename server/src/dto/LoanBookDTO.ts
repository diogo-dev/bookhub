export interface LoanBookDTO {
    loanID: string;
    loanCode: string;
    startAt: string;
    dueAt: string;
    loanStatus: string;
    itemStatus: string;
    itemID: string;
    bookTitle: string;
    bookIsbn: string;
    authors: string[];
}