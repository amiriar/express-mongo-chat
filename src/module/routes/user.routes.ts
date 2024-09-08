import { Router } from "express";
import userController from "./user.controller";
import Authorization from "../../common/guard/authorization.guard";
import { uploadFile } from "../../common/utils/multer";

const router = Router();

router.get("/whoami", Authorization, userController.whoami);
router.post("/", Authorization, uploadFile.single("profile"), userController.dashboard);

export const DashboardRoutes = router;
