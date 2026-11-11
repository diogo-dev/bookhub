import { Router } from "express";

import authRoutes from "./auth.routes";
import accountRoutes from "./accounts.routes";
import meRoutes from "./me.routes";
// import userRoutes from "./users.routes";
import loanRoutes from "./loans.routes";
import reservationRoutes from "./reservations.routes";
// import bookRoutes from "./books.routes";
import authorRoutes from "./authors.routes";
import publisherRoutes from "./publishers.routes";
import languageRoutes from "./languages.routes";
import categoryRoutes from "./categories.routes";
import roleRoutes from "./roles.routes";
import permissionRoutes from "./permissions.routes";

const routes = Router();

routes.get("/", (req, res) => {
    res.json({ message: "root endpoint"});
});

routes.use("/auth", authRoutes);
routes.use("/accounts", accountRoutes);
routes.use("/me", meRoutes);
// routes.use("/users", userRoutes);
routes.use("/loans", loanRoutes);
routes.use("/reservations", reservationRoutes);
// routes.use("/books", bookRoutes);
routes.use("/authors", authorRoutes);
routes.use("/publishers", publisherRoutes);
routes.use("/languages", languageRoutes);
routes.use("/categories", categoryRoutes);
routes.use("/roles", roleRoutes);
routes.use("/permissions", permissionRoutes);

export default routes;