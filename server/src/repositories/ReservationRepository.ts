import { Reservation } from "@/domain/Reservation";

export interface ReservationRepository {
    save(reservation: Reservation): Promise<Reservation>;
    findById(id: string): Promise<Reservation | null>;
    findByUserId(userId: string): Promise<Reservation[]>;
    findActiveByUserId(userId: string): Promise<Reservation[]>
    findByItemId(itemId: string): Promise<Reservation[]>;
    remove(reservation: Reservation): Promise<void>;
    listAll(): Promise<Reservation[]>;
}