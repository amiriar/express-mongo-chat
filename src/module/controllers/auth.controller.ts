import { Request, Response, NextFunction, Router } from 'express';
import autoBind from 'auto-bind';
import moment from 'jalali-moment';
import { VerifyAccessToken } from '../../common/middleware/verifyAccessToken';
import { CookieNames } from '../../common/constant/cookie.enum';
import { NodeEnv } from '../../common/constant/env.enum';
import { Authmessage } from '../messages/auth.messages';
import { otpService } from '../services/otp.service';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import authService from '../services/auth.service';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

export class AuthController {
  #service: typeof authService;

  constructor() {
    autoBind(this);
    this.#service = authService;
  }

  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = await registerSchema.validateAsync(req.body);
      const otp = await this.#service.sendOtp(validatedData.phone);

      // const otp = otpService.generateOtp();
      // Send OTP via SMS service or similar
      // Example: await smsService.sendOtp(phone, otp);

      res.status(200).send({ message: 'OTP با موفقیت ارسال شد.', otp });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const lastDateIn = moment().format('jYYYY/jMM/jDD HH:mm');
      const validatedData = await loginSchema.validateAsync(req.body);
      const { phone, otp } = validatedData;

      const isOtpValid = await this.#service.verifyOtp(phone, otp, lastDateIn);
      if (!isOtpValid) {
        throw new createHttpError.Unauthorized(Authmessage.InvalidCredentials);
      }

      const accessToken = await this.signToken({ phone });
      return res
        .cookie('accessToken', accessToken, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
          secure: process.env.NODE_ENV === 'production',
          // sameSite: 'strict',
        })
        .status(200)
        .send({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  private async signToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn: '30m' });
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

  async preventWhenLoggedIn(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (req.cookies[CookieNames.AccessToken]) {
      res.status(400).json({
        message: 'شما از قبل وارد شده اید.',
      });
    } else {
      next();
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    if (!req.body.refreshToken) {
      throw new createHttpError.Unauthorized('Refresh token is missing');
    }

    const { accessToken } = await this.#service.refreshTokens(
      req.body.refreshToken,
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
    });
    return res.status(200).json({ message: 'کوکی جدید ست شد' });
  }
}
