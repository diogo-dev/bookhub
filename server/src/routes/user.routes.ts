import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "@/auth/middleware";
import { userController } from "@/container";

const router = Router();

// Rotas públicas (mantidas sem autenticação como no comportamento original)
router.get("/id/:id", userController.showById);
router.get("/cpf/:cpf", userController.showByCpf);

router.get("/", authenticateJWT, authorizeRoles("ADMIN", "EMPLOYEE"), userController.list);
router.post("/", authenticateJWT, authorizeRoles("ADMIN"), userController.create);
router.patch("/:id", authenticateJWT, authorizeRoles("ADMIN"), userController.update);
router.delete("/:id", authenticateJWT, authorizeRoles("ADMIN"), userController.remove);

router.get("/:id/loans", authenticateJWT, authorizeRoles("ADMIN", "EMPLOYEE"), userController.listLoans);
router.get("/:id/reservations", authenticateJWT, authorizeRoles("ADMIN", "EMPLOYEE"), userController.listReservations);

export default router;
