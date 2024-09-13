import mongoose, { Document, ObjectId, Schema, Types } from "mongoose";

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
  status: "sent" | "delivered" | "seen";
  voiceUrl?: string; // Add this line for optional voice URL
}

const ChatMessageSchema = new Schema<IChatMessage>({
  // sender: { type: Types.ObjectId, required: true },
  // recipient: { type: Types.ObjectId, required: false },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: false },
  room: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: false },
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent",
  },
  voiceUrl: { type: String, required: false }, // Add this line for the voice URL
});

const ChatMessageModel = mongoose.model<IChatMessage>(
  "ChatMessage",
  ChatMessageSchema
);
export default ChatMessageModel;
