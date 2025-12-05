import { Response, NextFunction } from "express";
import { verifyToken } from "./jwt";
import { AuthRequest } from "@/dto/AuthRequest";

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: "Token inválido ou já expirado" });
    }
}

export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const normalize = (s: string) => s.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(normalize);
    const userRoles = req.user.roles?.map((r: any) => (typeof r === "string" ? r : r.name)).map(normalize) || [];
    const hasPermission = normalizedAllowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({ message: "Acesso negado: permissão insuficiente" });
    }

    next();
  };
}