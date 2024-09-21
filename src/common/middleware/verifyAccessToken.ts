import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import * as dotenv from "dotenv";
import UserModel from "../../module/models/user.model";

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function getToken(headers: Request["headers"]): string {
  const cookieHeader = headers?.cookie;

  if (!cookieHeader) {
    throw createHttpError.Unauthorized(
      "حساب کاربری شناسایی نشد وارد حساب کاربری خود شوید"
    );
  }

  const cookies = cookieHeader.split(";").reduce((acc: any, cookie: string) => {
    const [key, value] = cookie.split("=").map((c) => c.trim());
    acc[key] = value;
    return acc;
  }, {});

  const token: string = cookies?.accessToken;
  if (!token) {
    throw createHttpError.Unauthorized(
      "حساب کاربری شناسایی نشد وارد حساب کاربری خود شوید"
    );
  }

  return JSON.parse(decodeURIComponent(token));
}

// VerifyAccessToken middleware for OTP-based auth
export async function VerifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getToken(req.headers);
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      phone: string;
    };

    const { phone } = payload;

    if (!payload.phone) {
      throw createHttpError.Unauthorized("2وارد حساب کاربری خود شوید");
    }

    const user = await UserModel.findOne(
      { phoneNumber: phone },
      { password: 0, __v: 0, otp: 0, otpExpire: 0, refreshToken: 0 }
    );

    if (!user) {
      throw createHttpError.Unauthorized("حساب کاربری یافت نشد");
    }

    req.user = user;

    next();
  } catch (error) {
    // Handle errors and pass them to the next middleware
    console.log(error);

    next(createHttpError.Unauthorized("1وارد حساب کاربری خود شوید"));
  }
}
