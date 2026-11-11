import { Router } from "express";
import { roleController } from "@/container";

const router = Router();

router.get("/:id", roleController.show);
router.post("/", roleController.create);

export default router;
