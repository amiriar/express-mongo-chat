import express from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = express.Router();
const authController = new AuthController();

router.post('/send-otp', authController.sendOtp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

export default router;
