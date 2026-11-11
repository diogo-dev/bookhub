import { Request, Response } from "express";
import { AccountService } from "@/services/AccountService";
import { registerAccountSchema } from "@/schemas/accountSchemas";
import { withoutPasswordHash } from "@/mappers/userMapper";

export class AccountController {
  constructor(private accountService: AccountService) {}

  register = async (req: Request, res: Response) => {
    const { email, password } = registerAccountSchema.parse(req.body);
    const account = await this.accountService.register(email, password);

    res.status(201).json(withoutPasswordHash(account));
  };
}
