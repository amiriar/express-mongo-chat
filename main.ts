import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mainRouter from './src/app.routes';
import swaggerConfig from './src/config/swagger.config';
import NotFoundHandler from './src/common/exception/notFound.handler';
import AllExceptionHandler from './src/common/exception/all-exception.handler';
import { Server as SocketIOServer } from 'socket.io';
import { handleSocketConnections } from './src/socket/socket.handler';
import http from 'http';

dotenv.config();

async function main() {
  const app: Application = express();
  const server = http.createServer(app);
  const port = process.env.PORT || 3000;

  require('./src/config/mongoDB.config');

  app.use(
    cors({
      origin: ['http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Bearer', 'x-api-key'],
    }),
  );

  // app.use(cors());

  // const corsOptions = {
  //   origin: 'http://localhost:3000', // Change this to your frontend URL
  //   methods: 'GET,POST,PUT,DELETE,OPTIONS',
  //   credentials: true, // Allow credentials
  // };

  // app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(process.env.COOKIE_SECRET_KEY));

  app.use(mainRouter);

  swaggerConfig(app);

  NotFoundHandler(app);
  AllExceptionHandler(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle the 'sendMessage' event
    socket.on('sendMessage', (message) => {
      console.log('Message received:', message);

      // Save the message to the database or handle it as needed
      // For example, you might want to emit it to other clients
      io.emit('message', message);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  // Handle socket connections in a separate file
  handleSocketConnections(io);

  server.listen(port, () => {
    console.log(`Server is running on: http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
});
