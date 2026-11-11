import { Router } from "express";
import { authenticateJWT } from "@/auth/middleware";
import { meController } from "@/container";

const router = Router();

// Todas as rotas de /me exigem usuário autenticado
router.use(authenticateJWT);

router.get("/", meController.show);
router.patch("/", meController.update);
router.delete("/", meController.remove);

router.get("/interests", meController.listInterests);
router.post("/interests", meController.addInterest);
router.delete("/interests/:isbn", meController.removeInterest);

router.get("/loans", meController.listLoans);
router.get("/reservations", meController.listReservations);

export default router;
