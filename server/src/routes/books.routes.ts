import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "@/auth/middleware";
import { bookController } from "@/container";

const router = Router();

const staffOnly = [authenticateJWT, authorizeRoles("ADMIN", "EMPLOYEE")];

// Rotas estáticas antes de "/:isbn" para não serem capturadas como ISBN
router.get("/", bookController.catalog);
router.get("/stats", bookController.stats);
router.get("/all", ...staffOnly, bookController.list);
router.get("/search", bookController.search);
router.get("/search/admin", ...staffOnly, bookController.adminSearch);
router.get("/genre/:genre", bookController.listByGenre);

router.post("/", bookController.create);
router.get("/:isbn", bookController.show);
router.patch("/:isbn", ...staffOnly, bookController.update);
router.delete("/:isbn", ...staffOnly, bookController.remove);

router.get("/:isbn/items", bookController.listItems);
router.post("/:isbn/items", bookController.addItems);

export default router;
