import { Router } from "express";
import { authenticateJWT } from "@/auth/middleware";
import { loanController } from "@/container";

const router = Router();

router.use(authenticateJWT);

router.post("/", loanController.create);
router.patch("/:id/return", loanController.returnLoan);
router.get("/users/:cpf", loanController.listByUserCpf);

export default router;
