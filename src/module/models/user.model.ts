import mongoose, { Schema, model, Document, ObjectId } from 'mongoose';

export interface IUser extends Document {
  id: string,
  username: string;
  role?: string;
  lastDateIn?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profile?: string;
  bio?: string;
  otp?: string | null;
  otpExpire?: Date | null;
  refreshToken: string, 
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: false },
  role: { type: String, default: "USER" },
  lastDateIn: { type: String, required: false },
  email: { type: String, required: false },
  password: { type: String, required: false },
  phoneNumber: { type: String, required: true },
  profile: { type: String, required: false },
  bio: { type: String, required: false },
  otp: { type: String, required: true },
  otpExpire: { type: Date, required: true },
  refreshToken: { type: String },
}, { timestamps: true });

const UserModel = model<IUser>('User', UserSchema);
export default UserModel;
