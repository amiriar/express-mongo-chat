import { Socket } from "socket.io";
import mongoose from "mongoose";
import ChatMessageModel from "../../module/models/chatMessage.model";
import UserModel from "../../module/models/user.model";

export const messageEvents = (socket: Socket, io: any) => {
  socket.on("sendMessage", async (messageData) => {
    try {
      const { tempId, ...rest } = messageData;
      const newMessage = await ChatMessageModel.create(rest);

      const sender = await UserModel.findById(
        newMessage.sender,
        "username profile"
      );
      const recipient = await UserModel.findById(
        newMessage.recipient,
        "username profile"
      );

      const messageToSend = {
        _id: newMessage._id,
        tempId,
        content: newMessage.content,
        room: newMessage.room,
        timestamp: newMessage.timestamp,
        status: newMessage.status,
        isSending: false,
        voiceUrl: newMessage.voiceUrl,
        sender: {
          _id: sender?._id,
          username: sender?.username,
          profile: sender?.profile,
        },
        recipient: recipient
          ? {
              _id: recipient._id,
              username: recipient.username,
              profile: recipient.profile,
            }
          : null,
      };

      socket.to(newMessage.room).emit("message", messageToSend);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  socket.on("getHistory", async (roomName) => {
    try {
      const ids = roomName.split("-");
      const isPrivateChat =
        ids.length === 2 &&
        ids.every((id: string) => mongoose.Types.ObjectId.isValid(id));

      let history = [];

      if (isPrivateChat) {
        const [senderId, recipientId] = ids;
        history = await ChatMessageModel.find({
          $or: [
            { sender: senderId, recipient: recipientId },
            { sender: recipientId, recipient: senderId },
          ],
        }).populate("sender recipient", "username profile");
      } else {
        history = await ChatMessageModel.find({ room: roomName }).populate(
          "sender recipient",
          "username profile"
        );
      }

      socket.emit("sendHistory", history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      socket.emit("sendHistory", []);
    }
  });

  socket.on("messageSeen", async (messageId) => {
    await ChatMessageModel.updateOne({ _id: messageId }, { seen: true });
  });
};
