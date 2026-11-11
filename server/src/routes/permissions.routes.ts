import { Router } from "express";
import { permissionController } from "@/container";

const router = Router();

router.get("/:id", permissionController.show);
router.post("/", permissionController.create);

export default router;
