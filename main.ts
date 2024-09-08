import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import mainRouter from "./src/app.routes";
import swaggerConfig from "./src/config/swagger.config";
import NotFoundHandler from "./src/common/exception/notFound.handler";
import AllExceptionHandler from "./src/common/exception/all-exception.handler";

dotenv.config();

async function main() {
  const app: Application = express();
  const port = process.env.PORT || 3000;

  // MongoDB connection
  require("./src/config/mongoDB.config")

  // Use CORS middleware with specific options
  app.use(
    cors({
      origin: ["http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "Bearer", "x-api-key"],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET_KEY));

  // Main Router
  app.use(mainRouter);

  // Swagger Documentation
  swaggerConfig(app);

  // Exception Handlers
  NotFoundHandler(app);
  AllExceptionHandler(app);

  // Start Server
  app.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
});
