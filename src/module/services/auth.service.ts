import autoBind from "auto-bind";
import UserModel from "../models/user.model";
import createHttpError from "http-errors";
import { Authmessage } from "../messages/auth.messages";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { otpService } from "./otp.service"; // Assume otpService is implemented for OTP handling

class AuthService {
  #model;

  constructor() {
    autoBind(this);
    this.#model = UserModel;
  }

  async register(username: string, email: string, password: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new createHttpError.Unauthorized(Authmessage.InvalidEmail);
    }

    let user = await this.#model.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (user) {
      throw new createHttpError.Forbidden(Authmessage.AlreadyExist);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await this.#model.create({
      username,
      email,
      password: hashedPassword,
    });
    await user.save();
    return user;
  }

  async login(phone: string, otp: string) {
    const user = await this.#model.findOne({ phoneNumber:phone });

    if (!user) {
      throw new createHttpError.Unauthorized(Authmessage.InvalidCredentials);
    }

    // Validate OTP
    const isOtpValid = await otpService.verifyOtp(phone, otp);
    if (!isOtpValid) {
      throw new createHttpError.Unauthorized(Authmessage.InvalidCredentials);
    }

    const accessToken = await this.signToken({ phone, id: user._id });
    user.accessToken = accessToken;
    await user.save();
    return accessToken;
  }

  async signToken(payload: object) {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY!, { expiresIn: "1y" });
  }
}

export default new AuthService();
