import { Request, Response, NextFunction } from 'express';
import { uploadFile } from '../../common/utils/multer';
import path from 'path';
import autoBind from 'auto-bind';
import { updateUserSchema } from '../../module/schemas/user.schema'; // Correct path
import userService from '../services/user.service';

export class UserController {
  #service: typeof userService;

  constructor() {
    autoBind(this); // Bind class methods to instance
    this.#service = userService;
  }

  async whoami(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        const user = req.user;
        res.json(user);
      } else {
        res.status(401).json({
          statusCode: 401,
          message: 'Not Authorized',
          authorized: false,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body.fileUploadPath && req.body.filename) {
        req.body.profile = path
          .join(req.body.fileUploadPath, req.body.filename)
          .replace(/\\/g, '/');
      }

      const data = await updateUserSchema.validateAsync(req.body);

      const result = await this.#service.dashboard(data, req.user.phoneNumber, req.user.profile);

      return res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
