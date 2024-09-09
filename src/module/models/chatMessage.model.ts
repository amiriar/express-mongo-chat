import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  sender: string;
  recipient: string; // Could be a user ID or room ID
  content: string;
  timestamp: Date;
  date: string;
  status: 'sent' | 'delivered' | 'seen';
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sender: { type: String, required: true },  // User ID of the sender
  recipient: { type: String, required: true },  // User ID or room ID of the recipient
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  date: { type: String, required: false },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' }
});

const ChatMessageModel = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export default ChatMessageModel;
