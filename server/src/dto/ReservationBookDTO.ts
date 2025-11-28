export interface ReservationBookDTO {
    reservationId: number;
    startAt: string;
    endAt: string;
    itemStatus: string;
    bookTitle: string;
    bookIsbn: string;
    authors: string[];
}