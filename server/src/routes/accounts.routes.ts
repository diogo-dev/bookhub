import { Router } from "express";
import { accountController } from "@/container";

const router = Router();

router.post("/register", accountController.register);

export default router;
