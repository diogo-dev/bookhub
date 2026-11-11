import { Request, Response } from "express";
import { AuthService } from "@/auth/auth.service";
import { loginSchema, registerSchema } from "@/schemas/authSchemas";

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response) => {
    const credentials = loginSchema.parse(req.body);
    const result = await this.authService.login(credentials);

    res.status(200).json({
      message: "Login realizado com sucesso!",
      token: result.token,
      user: result.user,
    });
  };

  register = async (req: Request, res: Response) => {
    const credentials = registerSchema.parse(req.body);
    const result = await this.authService.register(credentials);

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      token: result.token,
      user: result.user,
    });
  };
}
