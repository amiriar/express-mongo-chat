import createHttpError from 'http-errors';
import { Authmessage } from '../messages/auth.messages';
import UserModel from '../models/user.model';

class OtpService {
  #userModel;
  constructor() {
    this.#userModel = UserModel;
  }

  generateOtp(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    let user = await this.#userModel.findOne({ phoneNumber: phone });

    if (!user) {
      throw new createHttpError.Unauthorized(Authmessage.NotFound);
    }

    if (user.otp && user.otpExpire && new Date() > user.otpExpire) {
      throw new createHttpError.Unauthorized(Authmessage.OtpExpired);
    } else {
      if (user.otp == otp) {
        return true;
      } else {
        return false;
      }
    }
  }
}

export const otpService = new OtpService();
