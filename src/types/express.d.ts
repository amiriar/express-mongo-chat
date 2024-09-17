import { IUser } from "../module/models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser; 
    }
  }
}
declare module "socket.io" {
  interface Socket {
    userData?: IUser; 
  }
}