import { Schema, model, Document } from 'mongoose';

interface IUser extends Document {
  firstName?: string;
  lastName?: string;
  username: string;
  role?: string;
  lastDateIn?: string;
  email: string;
  password: string;
  age?: number;
  job?: string;
  phoneNumber?: string;
  education?: string;
  isStudent?: string;
  profile?: string;
  description?: string;
  linkedin?: string;
  pinterest?: string;
  twitterX?: string;
  facebook?: string;
  accessToken?: string;
}

const UserSchema = new Schema<IUser>({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  username: { type: String, required: true },
  role: { type: String, default: "USER" },
  lastDateIn: { type: String, required: false },
  email: { type: String, required: true },
  password: { type: String, required: true },
  age: { type: Number, required: false },
  job: { type: String, required: false },
  phoneNumber: { type: String, required: false },
  education: { type: String, required: false },
  isStudent: { type: String, required: false },
  profile: { type: String, required: false },
  description: { type: String, required: false },
  linkedin: { type: String, required: false },
  pinterest: { type: String, required: false },
  twitterX: { type: String, required: false },
  facebook: { type: String, required: false },
  accessToken: { type: String },
}, { timestamps: true });

const UserModel = model<IUser>('User', UserSchema);
export default UserModel;
