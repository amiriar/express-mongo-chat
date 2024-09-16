import { Application, Request, Response, NextFunction } from "express";

function AllExceptionHandler(app: Application): void {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.log(err);
    let status = err?.status ?? err?.statusCode ?? err?.code;
    if (!status || isNaN(+status) || status > 511 || status < 200) status = 500;
    
    res.status(status).json({
      message: err?.message ?? err?.stack ?? "InternalServerError",
    });
  });
}

export default AllExceptionHandler;
