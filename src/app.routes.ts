import { Router } from "express";
import AuthRouter from "./module/routes/auth.routes";
import { DashboardRoutes } from "./module/routes/user.routes";
import { VerifyAccessToken } from "./common/middleware/verifyAccessToken";
import { ChatRoutes } from "./module/routes/chat.routes";

const mainRouter = Router();

// Example route for future
// mainRouter.use("/api/admin/panel", VerifyAccessToken, adminRouter);

// Authentication routes
mainRouter.use("/api/auth", AuthRouter);
mainRouter.use("/api/dashboard", VerifyAccessToken, DashboardRoutes);
mainRouter.use("/api/chat", VerifyAccessToken, ChatRoutes);

export default mainRouter;
