export interface ReservationBookDTO {
    reservationID: string;
    startAt: string;
    endAt: string;
    itemStatus: string;
    itemID: string;
    bookTitle: string;
    bookIsbn: string;
    authors: string[];
}