import autoBind from 'auto-bind';
import UserModel, { IUser } from '../models/user.model';
import createHttpError from 'http-errors';
import { Authmessage } from '../messages/auth.messages';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { otpService } from './otp.service'; // Assume otpService is implemented for OTP handling

class AuthService {
  #model;
  #OtpService;

  constructor() {
    autoBind(this);
    this.#model = UserModel;
    this.#OtpService = otpService;
  }

  async sendOtp(phone: string) {
    let user = await this.#model.findOne({ phoneNumber: phone });

    if (!user) {
      user = await this.#model.create({ phoneNumber: phone });
    }

    if (user.otpExpire && user.otpExpire > new Date()) {
      throw new createHttpError.Forbidden(Authmessage.OtpNotExpired);
    }

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 2); // OTP expiration for 2 minutes

    user.otp = this.#OtpService.generateOtp();
    user.otpExpire = expirationTime;

    await user.save();
    return user.otp;
  }

  generateOtp(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  async verifyOtp(
    phone: string,
    otp: string,
    lastDateIn: string,
  ): Promise<boolean> {
    let user = await this.#model.findOne({ phoneNumber: phone });

    if (!user) {
      throw new createHttpError.Unauthorized(Authmessage.NotFound);
    }

    if (user.otp && user.otpExpire && new Date() > user.otpExpire) {
      throw new createHttpError.Unauthorized(Authmessage.OtpExpired);
    } else {
      user.lastDateIn = lastDateIn;
      user.save();
      if (user.otp == otp) {
        return true;
      } else {
        return false;
      }
    }
  }

  // async login(phone: string, otp: string) {
  //   const user = await this.#model.findOne({ phoneNumber: phone });

  //   if (!user) {
  //     throw new createHttpError.Unauthorized(Authmessage.InvalidCredentials);
  //   }

  //   // Validate OTP
  //   const isOtpValid = await otpService.verifyOtp(phone, otp);
  //   if (!isOtpValid) {
  //     throw new createHttpError.Unauthorized(Authmessage.InvalidCredentials);
  //   }

  //   // const { accessToken, refreshToken } = await this.signToken({
  //   //   phone,
  //   //   id: user._id,
  //   // });

  //   // user.refreshToken = refreshToken;
  //   await user.save();
  //   return 'accessToken';
  // }

  // async signToken(payload: object) {
  //   return jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn: '30m' });
  // }

  // Signing the refresh token with user id in the signTokens method
  async signTokens(phone: string) {
    const user = await this.#model.findOne({ phoneNumber: phone });

    if (!user) throw new createHttpError.Unauthorized(Authmessage.PleaseLogin);

    // Sign the refresh token using user ID
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET_KEY!,
      {
        expiresIn: '7d',
      },
    );

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: '30m',
      },
    );

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }

  // Verifying the refresh token in the refreshTokens method
  async refreshTokens(refreshToken: string) {
    try {
      // Verify the refresh token and ensure the result is a JwtPayload
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY as string,
      ) as jwt.JwtPayload;

      if (!decoded || !decoded.phone) {
        throw new createHttpError.Unauthorized('InvalidAccessToken');
      }

      const user = await this.#model.findOne({ phoneNumber: decoded.phone });

      if (!user || user.refreshToken !== refreshToken) {
        throw new createHttpError.Unauthorized('InvalidUserData');
      }

      // Generate a new access token
      const newAccessToken = jwt.sign(
        { phone: user.phoneNumber },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: '30m' },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new createHttpError.Unauthorized('InvalidRefreshToken');
    }
  }
}

export default new AuthService();
