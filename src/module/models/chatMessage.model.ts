import mongoose, { Document, ObjectId, Schema } from 'mongoose';

export interface IUserInfo {
  _id: ObjectId | string;
  username: string;
  profile: string;
  phone: string;
}

export interface IChatMessage extends Document {
  sender: IUserInfo;
  recipient: IUserInfo;
  content: string;
  room: string;
  timestamp: Date;
  date: string;
  status: 'sent' | 'delivered' | 'seen';
}

const UserInfoSchema = new Schema<IUserInfo>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  phone: { type: String, required: false },
});

const ChatMessageSchema = new Schema<IChatMessage>({
  sender: { type: UserInfoSchema, required: true },  // Embedded sender object
  recipient: { type: UserInfoSchema, required: false },  // Embedded recipient object
  content: { type: String, required: true },
  room: { type: String, required: true },  // Room for the chat
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: false },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
});

const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessageModel;
