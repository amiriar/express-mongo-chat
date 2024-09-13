import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { VerifyAccessToken } from '../../common/middleware/verifyAccessToken';

const router = express.Router();
const authController = new AuthController();

router.post('/send-otp', authController.preventWhenLoggedIn, authController.sendOtp);
router.post('/login', authController.login);
router.get('/logout', VerifyAccessToken, authController.logout);
router.post('/refresh-token', authController.refreshToken);

export default router;
