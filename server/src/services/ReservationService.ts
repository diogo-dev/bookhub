import { Client } from "pg";
import { Reservation } from "@/domain/Reservation";
import { ReservationBookDTO } from "@/dto/ReservationBookDTO";
import { ReservationRepository } from "@/repositories/ReservationRepository";
import { ItemRepository } from "@/repositories/ItemRepository";
import { HttpError } from "@/errors/HttpError";

export class ReservationService {
  constructor(
    private reservationRepository: ReservationRepository,
    private itemRepository: ItemRepository,
    private client: Client,
  ) {}

  async createReservation(userID: string, itemID: string, startAt: number, endAt: number): Promise<Reservation> {
    // talvez não deixar o usuário fazer mais de uma reserva ativa para o mesmo exemplar
    const activeReservations = await this.reservationRepository.findActiveByUserId(userID);
    const now = Date.now();
    const hasActiveReservation = activeReservations.some(r => r.startAt <= now && r.endAt >= now);
    if (hasActiveReservation) throw new HttpError(400, "Reserva ativa, compareça na loja para pegar o exemplar");

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
      );

      await this.reservationRepository.save(reservation);
      await this.itemRepository.updateStatus(itemID, "reservado");
      await this.client.query("COMMIT;");
      return reservation;
    } catch (error) {
      await this.client.query("ROLLBACK;");
      throw error;
    }
  }

  async getUserReservationsAndBookInfo(userID: string): Promise<ReservationBookDTO[]> {
    return this.reservationRepository.findReservationListByUser(userID);
  }
}
