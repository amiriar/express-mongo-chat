import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { uploadFile } from "../../common/utils/multer";
import { VerifyAccessToken } from "../../common/middleware/verifyAccessToken";

const router = Router();
const userController = new UserController(); // Instantiate UserController

router.get("/whoami", VerifyAccessToken, userController.whoami);
router.post("/", VerifyAccessToken, uploadFile.single("profile"), userController.dashboard);

export const DashboardRoutes = router;
