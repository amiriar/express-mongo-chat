import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import UserModel from '../../module/models/user.model';

dotenv.config();

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // You can replace 'any' with your UserModel type (e.g., IUser)
    }
  }
}

// Helper function to extract token from cookies
export function getToken(headers: Request['headers']): string {
  const cookieHeader = headers?.cookie;

  if (!cookieHeader) {
    throw createHttpError.Unauthorized(
      'حساب کاربری شناسایی نشد وارد حساب کاربری خود شوید',
    );
  }

  const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
    const [key, value] = cookie.split('=').map((c) => c.trim());
    acc[key] = value;
    return acc;
  }, {});

  const token = cookies?.accessToken;
  if (!token) {
    throw createHttpError.Unauthorized(
      'حساب کاربری شناسایی نشد وارد حساب کاربری خود شوید',
    );
  }

  return token;
}

// VerifyAccessToken middleware for OTP-based auth
export async function VerifyAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = getToken(req.headers);

    // Verify the JWT token and extract the payload
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as {
      phone: string;
    };

    const { phone } = payload;

    if (!phone) {
      throw createHttpError.Unauthorized('وارد حساب کاربری خود شوید');
    }

    const user = await UserModel.findOne(
      { phoneNumber: phone },
      { password: 0, __v: 0, otp: 0, otpExpire: 0, refreshToken: 0 },
    );

    if (!user) {
      throw createHttpError.Unauthorized('حساب کاربری یافت نشد');
    }

    req.user = user;

    next();
  } catch (error) {
    // Handle errors and pass them to the next middleware
    next(createHttpError.Unauthorized('وارد حساب کاربری خود شوید'));
  }
}
