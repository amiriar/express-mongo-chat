import mongoose, { Schema, model, Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  id: string,
  username: string;
  firstname: string;
  lastname: string;
  role?: string;
  lastDateIn?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profile?: string;
  bio?: string;
  otp?: string | null;
  otpExpire?: Date | null;
  status?: string;
  lastSeen?: Date;
  refreshToken: string, 
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: false },
  firstname: { type: String, required: false },
  lastname: { type: String, required: false },
  role: { type: String, default: "USER" },
  lastDateIn: { type: String, required: false },
  email: { type: String, required: false },
  password: { type: String, required: false },
  phoneNumber: { type: String, required: true },
  profile: { type: String, required: false },
  bio: { type: String, required: false },
  otp: { type: String, required: false },
  otpExpire: { type: Date, required: false },
  status: { type: String, default: 'offline' },
  lastSeen: { type: Date },
  refreshToken: { type: String },
}, { timestamps: true });

const UserModel = model<IUser>('User', UserSchema);
export default UserModel;
