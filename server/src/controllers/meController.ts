import { Response } from "express";
import { AuthRequest } from "@/dto/AuthRequest";
import { ProfileService } from "@/services/ProfileService";
import { InterestService } from "@/services/InterestService";
import { LoanService } from "@/services/LoanService";
import { ReservationRepository } from "@/repositories/ReservationRepository";
import { toUserResponse } from "@/mappers/userMapper";
import { addInterestSchema, interestIsbnParamsSchema, updateProfileSchema } from "@/schemas/meSchemas";

export class MeController {
  constructor(
    private profileService: ProfileService,
    private interestService: InterestService,
    private loanService: LoanService,
    private reservationRepository: ReservationRepository,
  ) {}

  show = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.sub;
    const user = await this.profileService.getProfile(userId);

    res.status(200).json(toUserResponse(user));
  };

  update = async (req: AuthRequest, res: Response) => {
    const data = updateProfileSchema.parse(req.body);
    const userId = req.user!.sub;

    const user = await this.profileService.updateProfile(userId, data);

    res.status(200).json(toUserResponse(user));
  };

  remove = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.sub;
    await this.profileService.deleteAccount(userId);

    res.status(200).json({ message: "Conta deletada com sucesso." });
  };

  listInterests = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.sub;
    const interests = await this.interestService.getUserInterests(userId);

    res.status(200).json(interests);
  };

  addInterest = async (req: AuthRequest, res: Response) => {
    const { bookISBN } = addInterestSchema.parse(req.body);
    const userId = req.user!.sub;

    const interest = await this.interestService.addInterest(userId, bookISBN);

    res.status(201).json(interest);
  };

  removeInterest = async (req: AuthRequest, res: Response) => {
    const { isbn } = interestIsbnParamsSchema.parse(req.params);
    const userId = req.user!.sub;

    await this.interestService.removeInterest(userId, isbn);

    res.status(200).json({ message: "Interesse removido com sucesso." });
  };

  listLoans = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.sub;
    const loans = await this.loanService.getUserLoansAndBookInfo(userId);

    res.status(200).json(loans);
  };

  listReservations = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.sub;
    const reservations = await this.reservationRepository.findReservationListByUser(userId);

    res.status(200).json(reservations);
  };
}
