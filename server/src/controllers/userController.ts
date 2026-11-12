import { Request, Response } from "express";
import { AuthRequest } from "@/dto/AuthRequest";
import { UserService } from "@/services/UserService";
import { LoanService } from "@/services/LoanService";
import { ReservationService } from "@/services/ReservationService";
import { toUserResponse, withoutPasswordHash } from "@/mappers/userMapper";
import {
  createUserSchema,
  updateUserSchema,
  userCpfParamsSchema,
  userIdParamsSchema,
} from "@/schemas/userSchemas";

export class UserController {
  constructor(
    private userService: UserService,
    private loanService: LoanService,
    private reservationService: ReservationService,
  ) {}

  showById = async (req: Request, res: Response) => {
    const { id } = userIdParamsSchema.parse(req.params);
    const user = await this.userService.getById(id);

    res.status(200).json(withoutPasswordHash(user));
  };

  showByCpf = async (req: Request, res: Response) => {
    const { cpf } = userCpfParamsSchema.parse(req.params);
    const user = await this.userService.getByCpf(cpf);

    res.status(200).json(withoutPasswordHash(user));
  };

  list = async (req: Request, res: Response) => {
    const users = await this.userService.list();

    res.status(200).json(users.map(toUserResponse));
  };

  create = async (req: Request, res: Response) => {
    const data = createUserSchema.parse(req.body);
    const user = await this.userService.create(data);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      roles: user.roles.map(r => r.name),
    });
  };

  update = async (req: Request, res: Response) => {
    const { id } = userIdParamsSchema.parse(req.params);
    const data = updateUserSchema.parse(req.body);
    const user = await this.userService.update(id, data);

    res.status(200).json(toUserResponse(user));
  };

  remove = async (req: AuthRequest, res: Response) => {
    const { id } = userIdParamsSchema.parse(req.params);
    await this.userService.delete(id, req.user!.sub);

    res.status(200).json({ message: "Funcionário deletado com sucesso." });
  };

  listLoans = async (req: Request, res: Response) => {
    const { id } = userIdParamsSchema.parse(req.params);
    const loans = await this.loanService.getUserLoansAndBookInfo(id);

    res.status(200).json(loans);
  };

  listReservations = async (req: Request, res: Response) => {
    const { id } = userIdParamsSchema.parse(req.params);
    const reservations = await this.reservationService.getUserReservationsAndBookInfo(id);

    res.status(200).json(reservations);
  };
}
