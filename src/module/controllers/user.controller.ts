import { Request, Response, NextFunction, Router } from "express";
import userController from "./user.controller";
import Authorization from "../../common/guard/authorization.guard";
import { uploadFile } from "../../common/utils/multer";
import path from "path";

class UserController {
  private #service: typeof userController;

  constructor() {
    autoBind(this);
    this.#service = userController;
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
      const user = req.user;
      const result = await this.#service.dashboard(data, user);
      res.json({ result });
    } catch (error) {
      next(error);
    }
  }
}

export const DashboardRoutes = Router()
  .get("/whoami", Authorization, (req: Request, res: Response, next: NextFunction) => new UserController().whoami(req, res, next))
  .post("/", Authorization, uploadFile.single("profile"), (req: Request, res: Response, next: NextFunction) => new UserController().dashboard(req, res, next));
