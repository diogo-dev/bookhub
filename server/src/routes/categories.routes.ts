import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "@/auth/middleware";
import { categoryController } from "@/container";

const router = Router();

router.get("/", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), categoryController.index);
router.get("/:id", categoryController.show);
router.post("/", categoryController.create);

export default router;
