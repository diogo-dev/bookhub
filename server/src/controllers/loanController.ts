import { Request, Response } from "express";
import { LoanService } from "@/services/LoanService";
import { ProfileService } from "@/services/ProfileService";
import { createLoanSchema, loanIdParamsSchema, userCpfParamsSchema } from "@/schemas/loanSchemas";
import { withoutPasswordHash } from "@/mappers/userMapper";

export class LoanController {
  constructor(
    private loanService: LoanService,
    private profileService: ProfileService,
  ) {}

  create = async (req: Request, res: Response) => {
    const { userID, itemID, startAt, dueAt, reservationID } = createLoanSchema.parse(req.body);

    const loan = await this.loanService.createLoan(userID, itemID, startAt, dueAt, reservationID);

    res.status(201).json(loan);
  };

  returnLoan = async (req: Request, res: Response) => {
    const { id } = loanIdParamsSchema.parse(req.params);

    const { loan, item } = await this.loanService.returnLoanAndItem(id);

    res.status(200).json({ message: "Empréstimo devolvido com sucesso.", loan, item });
  };

  listByUserCpf = async (req: Request, res: Response) => {
    const { cpf } = userCpfParamsSchema.parse(req.params);
    const user = await this.profileService.getProfileByCpf(cpf);
    const loans = await this.loanService.getUserLoansAndBookInfo(user.ID);

    res.status(200).json({ user: withoutPasswordHash(user), loans });
  };
}
