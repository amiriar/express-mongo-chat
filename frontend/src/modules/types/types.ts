import mongoose from "mongoose";

export interface Message {
  _id?: string;
  tempId: string;
  sender: Sender;
  recipient: Recipient;
  content: string;
  room: string;
  publicName: string;
  timestamp?: Date | null;
  voiceUrl?: string;
  fileUrl?: string;
  isSending: boolean;
  isEdited: boolean;
  isForwarded: boolean;
  isPinned: boolean;
  replyTo: ReplyTo;
}

export interface ReplyTo {
  _id: mongoose.Types.ObjectId | string;
  content?: string;
  sender: Sender;
  voiceUrl?: string;
  fileUrl?: string;
  timestamp: Date;
}

export interface Sender {
  _id: string;
  username?: string;
  phone?: string;
  profile?: string;
}

export interface Recipient {
  _id: string;
  username?: string;
  phone?: string;
  profile?: string;
}

export interface Room {
  _id: string;
  roomName: string;
  participants: mongoose.Types.ObjectId[];
  isGroup: boolean;
  createdAt: Date;
  isPublic: boolean;
}

export interface IUser {
  _id: string;
  username: string;
  profile: string;
  lastSeen?: Date;
}
