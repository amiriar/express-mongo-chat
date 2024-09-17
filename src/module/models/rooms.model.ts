import mongoose, { Schema, model, Document } from 'mongoose';

export interface IRoom extends Document {
  roomName: string;             // Name of the room
  participants: Schema.Types.ObjectId[];  // Array of user ObjectIds (participants)
  isGroup: boolean;             // Indicates if the room is a group room or a direct chat
  createdAt: Date;              // Room creation timestamp
  isPublic: boolean;            // Indicates if the room is public (e.g., General, Announcements)
}

const RoomSchema = new Schema<IRoom>({
  roomName: { type: String, required: true, unique: true },  // Room name should be unique
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],  // Array of participants (ObjectId referencing User model)
  isGroup: { type: Boolean, default: false },  // Boolean indicating if it's a group room
  isPublic: { type: Boolean, default: false }, // Boolean indicating if it's a public room
  createdAt: { type: Date, default: Date.now }, // Auto-set createdAt timestamp
});

// Ensure the `roomName` is unique to prevent duplicate rooms
RoomSchema.index({ roomName: 1 }, { unique: true });

const RoomModel = model<IRoom>('room', RoomSchema);
export default RoomModel;
