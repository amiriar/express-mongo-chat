import { Application, Request, Response, NextFunction } from "express";

function NotFoundHandler(app: Application): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
      message: "Not found route",
    });
  });
}

export default NotFoundHandler;
