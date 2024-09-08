import createHttpError from 'http-errors';
import JWT from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET_KEY } from '../constant/constans';
import UserModel from '../../modules/user/user.model';
import { Request, Response, NextFunction } from 'express';

export function getToken(headers: Request['headers'], res: Response): string {
  const cookies = headers?.cookie?.split(';').reduce((acc: any, cookie: string) => {
    const [key, value] = cookie.split('=').map(c => c.trim());
    acc[key] = value;
    return acc;
  }, {});

  const token = cookies?.accessToken;
  if (!token) {
    throw createHttpError.Unauthorized('حساب کاربری شناسایی نشد وارد حساب کاربری خود شوید');
  }
  return token;
}

export function VerifyAccessToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = getToken(req.headers, res);
    JWT.verify(token, ACCESS_TOKEN_SECRET_KEY, async (err, payload) => {
      try {
        if (err) throw createHttpError.Unauthorized('وارد حساب کاربری خود شوید');

        const { email, username } = payload as { email: string; username: string };

        const query: { email?: string; username?: string } = {};
        if (email) query.email = email;
        else if (username) query.username = username;

        const user = await UserModel.findOne(query, { password: 0 });
        if (!user) throw createHttpError.Unauthorized('حساب کاربری یافت نشد');

        req.user = user;
        return next();
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
}
