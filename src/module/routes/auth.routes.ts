import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { VerifyAccessToken } from "../../common/middleware/verifyAccessToken";

const router = Router();

router.post("/register", AuthController.preventWhenLoggedIn, AuthController.register); // Sends OTP
router.post("/login", AuthController.preventWhenLoggedIn, AuthController.login); // Logs in using OTP
router.get("/logout", VerifyAccessToken, AuthController.logout); // Logs out

export const AuthRouter = router;
