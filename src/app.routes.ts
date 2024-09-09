import { Router } from "express";
import AuthRouter from "./module/routes/auth.routes";
import { DashboardRoutes } from "./module/routes/user.routes";
import { VerifyAccessToken } from "./common/middleware/verifyAccessToken";

const mainRouter = Router();

// Example route for future
// mainRouter.use("/api/admin/panel", VerifyAccessToken, adminRouter);

// Authentication routes
mainRouter.use("/api/auth", AuthRouter);
mainRouter.use("/api/dashboard", VerifyAccessToken, DashboardRoutes);

export default mainRouter;
