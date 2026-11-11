import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "@/auth/middleware";
import { publisherController } from "@/container";

const router = Router();

router.get("/", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), publisherController.index);
router.get("/:name", publisherController.show);
router.post("/", publisherController.create);
router.post("/find-or-create", authenticateJWT, authorizeRoles('ADMIN', 'EMPLOYEE'), publisherController.findOrCreate);

export default router;
