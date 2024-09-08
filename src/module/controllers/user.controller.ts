import { Request, Response, NextFunction } from "express";
import { uploadFile } from "../../common/utils/multer";
import path from "path";
import autoBind from "auto-bind";
import { updateUserSchema } from "../../module/schemas/user.schema"; // Correct path

export class UserController {
  constructor() {
    autoBind(this); // Bind class methods to instance
  }

  async whoami(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        const user = req.user;
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

  async dashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.body.fileUploadPath && req.body.filename) {
        req.body.profile = path.join(req.body.fileUploadPath, req.body.filename).replace(/\\/g, "/");
      }

      const data = await updateUserSchema.validateAsync(req.body);
      // Process the data here; the `dashboard` method should be implemented or replaced
      res.json({ result: 'Processing data' }); // Replace with actual result
    } catch (error) {
      next(error);
    }
  }
}
