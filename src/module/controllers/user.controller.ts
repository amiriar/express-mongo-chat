import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../../common/utils/multer";
import path from "path";
import autoBind from "auto-bind";
import { updateUserSchema } from "../../module/schemas/user.schema"; // Correct path
import userService from "../services/user.service";
import UserModel from "../models/user.model";

export class UserController {
  #service: typeof userService;
  #model: typeof UserModel;

  constructor() {
    autoBind(this); // Bind class methods to instance
    this.#service = userService;
    this.#model = UserModel;
  }

  async whoami(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        const user = await this.#model.findOne(req.user._id, {
          id: 1,
          username: 1,
          firstname: 1,
          lastname: 1,
          profile: 1,
          email: 1,
          bio: 1
        });
        res.json(user);
      } else {
        res.status(401).json({
          statusCode: 401,
          message: "Not Authorized",
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
          .replace(/\\/g, "/");
      }

      const data = await updateUserSchema.validateAsync(req.body);

      const result = await this.#service.dashboard(
        data,
        req.user.phoneNumber,
        req.user.profile
      );

      return res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}
