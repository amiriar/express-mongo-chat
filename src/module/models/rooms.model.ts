import mongoose, { Schema, model, Document } from "mongoose";

export interface IRoom extends Document {
  roomName: string;
  participants: Schema.Types.ObjectId[];
  pinnedMessage: Schema.Types.ObjectId;
  isGroup: boolean;
  createdAt: Date;
  isPublic: boolean;
}

const RoomSchema = new Schema<IRoom>({
  roomName: { type: String, required: true, maxlength: 15 },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  pinnedMessage: { type: Schema.Types.ObjectId, ref: "ChatMessage" },
  isGroup: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Ensure the `roomName` is unique to prevent duplicate rooms
// RoomSchema.index({ roomName: 1 }, { unique: true });

const RoomModel = model<IRoom>("room", RoomSchema);
export default RoomModel;
