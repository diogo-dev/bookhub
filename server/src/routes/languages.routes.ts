import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "@/auth/middleware";
import { languageController } from "@/container";

const router = Router();

router.get("/", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), languageController.index);
router.get("/:iso_code", languageController.show);
router.post("/", languageController.create);
router.post("/find-or-create", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), languageController.findOrCreate);

export default router;
