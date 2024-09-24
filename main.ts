import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./src/app.routes";
import swaggerConfig from "./src/config/swagger.config";
import NotFoundHandler from "./src/common/exception/notFound.handler";
import AllExceptionHandler from "./src/common/exception/all-exception.handler";
import { Server as SocketIOServer } from "socket.io";
import { handleSocketConnections } from "./src/socket/socket.handler";
import http from "http";
import path from "path";

dotenv.config();

async function main() {
  const app: Application = express();
  const server = http.createServer(app);
  const port = process.env.PORT || 3000;

  require("./src/config/mongoDB.config");

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:4173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "Bearer", "x-api-key"],
    })
  );

  app.use("/public", express.static(path.join(__dirname, "public")));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET_KEY));

  app.use(mainRouter);

  swaggerConfig(app);
  NotFoundHandler(app);
  AllExceptionHandler(app);

  const io = new SocketIOServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Handle socket connections
  handleSocketConnections(io);

  server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error("Failed to start server:", error);
});
