// src/types/express.d.ts
import { User } from '../../modules/user/user.model'; // Adjust import according to your model

declare global {
  namespace Express {
    interface Request {
      user?: User; // Replace User with the correct type if necessary
    }
  }
}
