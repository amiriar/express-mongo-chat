import { Request, Response, NextFunction, Router } from "express";
import authService from "../services/auth.service";
import autoBind from "auto-bind";
import moment from "jalali-moment";
import { VerifyAccessToken } from "../../common/middleware/verifyAccessToken";
import { CookieNames } from "../../common/constant/cookie.enum";
import { NodeEnv } from "../../common/constant/env.enum";
import { Authmessage } from "../messages/auth.messages";
import { loginSchema } from "../schemas/auth.schema";
import { otpService } from "../services/otp.service";
import createHttpError from "http-errors";
import { registerSchema } from "../schemas/auth.schema";
import jwt from "jsonwebtoken";

class AuthController {
  #service: typeof authService;

  constructor() {
    autoBind(this);
    this.#service = authService;
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = await registerSchema.validateAsync(req.body);
      const { phone } = validatedData;
      
      // Generate OTP and send to the phone number
      const otp = otpService.generateOtp(phone);
      // Send OTP via SMS service or similar
      // Example: await smsService.sendOtp(phone, otp);
      
      res.status(200).send({ message: "OTP sent to your phone" });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = await loginSchema.validateAsync(req.body);
      const { phone, otp } = validatedData;
      
      // Verify OTP
      const isOtpValid = await otpService.verifyOtp(phone, otp);
      if (!isOtpValid) {
        throw new createHttpError.Unauthorized(Authmessage.InvalidCredentials);
      }

      // Perform additional login logic, such as generating a token
      const accessToken = await this.signToken({ phone });
      res.status(200).send({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  private async signToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn: "1y" });
  }
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(CookieNames.AccessToken).status(200).json({
        message: Authmessage.LoggedOutSuccessfully,
      });
    } catch (error) {
      next(error);
    }
  }

  async preventWhenLoggedIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.cookies[CookieNames.AccessToken]) {
      res.status(400).json({
        message: "شما از قبل وارد شده اید.",
      });
    } else {
      next();
    }
  }
}
module.exports = AuthController