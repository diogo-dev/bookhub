import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "@/auth/middleware";
import { authorController } from "@/container";

const router = Router();

router.get("/", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), authorController.index);
router.get("/:id", authorController.show);
router.post("/", authorController.create);
router.post("/find-or-create", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), authorController.findOrCreate);

export default router;
