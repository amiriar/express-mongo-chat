import mongoose, { Document, ObjectId, Schema } from "mongoose";

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
  voiceUrl?: string;
  fileUrl?: string;
  isEdited: boolean;
  isPinned: boolean;
  isDeleted: boolean;
  isDeletedForMe: boolean;
  replyTo: ObjectId | string;
  forwardedFrom?: ObjectId | string;
  deletedBy?: ObjectId | string;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, required: false },
  room: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: false },
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent",
  },
  voiceUrl: { type: String, required: false },
  fileUrl: { type: String, required: false },
  isPinned: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage" },
  forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deletedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ],
});

const ChatMessageModel = mongoose.model<IChatMessage>(
  "ChatMessage",
  ChatMessageSchema
);
export default ChatMessageModel;
