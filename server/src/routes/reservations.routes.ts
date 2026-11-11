import { Router } from "express";
import { authenticateJWT } from "@/auth/middleware";
import { reservationController } from "@/container";

const router = Router();

router.use(authenticateJWT);

router.post("/", reservationController.create);
router.get("/users/:cpf", reservationController.listByUserCpf);

export default router;
