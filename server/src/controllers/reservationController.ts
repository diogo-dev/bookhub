import { Request, Response } from "express";
import { AuthRequest } from "@/dto/AuthRequest";
import { ReservationService } from "@/services/ReservationService";
import { ProfileService } from "@/services/ProfileService";
import { createReservationSchema, userCpfParamsSchema } from "@/schemas/reservationSchemas";
import { withoutPasswordHash } from "@/mappers/userMapper";

export class ReservationController {
  constructor(
    private reservationService: ReservationService,
    private profileService: ProfileService,
  ) {}

  create = async (req: AuthRequest, res: Response) => {
    const { itemID, startAt, endAt } = createReservationSchema.parse(req.body);
    const userId = req.user!.sub;

    const reservation = await this.reservationService.createReservation(userId, itemID, startAt, endAt);

    res.status(201).json(reservation);
  };

  listByUserCpf = async (req: Request, res: Response) => {
    const { cpf } = userCpfParamsSchema.parse(req.params);
    const user = await this.profileService.getProfileByCpf(cpf);
    const reservations = await this.reservationService.getUserReservationsAndBookInfo(user.ID);

    res.status(200).json({ user: withoutPasswordHash(user), reservations });
  };
}
