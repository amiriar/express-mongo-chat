import mongoose from "mongoose";
import ChatMessageModel from "../module/models/chatMessage.model";
import UserModel from "../module/models/user.model";
import { Server, Socket } from "socket.io";

export const handleSocketConnections = (io: Server) => {
  const onlineUsers = new Map();
  io.on("connection", (socket: Socket) => {
    console.log(`New user connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    onlineUsers.set(userId, socket.id);

    UserModel.findById(userId).then((user) => {
      if (user) {
        const userInfo = {
          userId: user._id,
          username: user.username,
          profile: user.profile,
          phone: user.phoneNumber,
        };

        // Add user to the map
        onlineUsers.set(userId, userInfo);

        // Emit updated online users list to all clients
        io.emit("onlineUsers", Array.from(onlineUsers.values()));

        // Emit offline users list
        sendOfflineUsers(socket);
      }
    });

    // Handle chat message
    // socket.on("chatMessage", (message) => {
    //   // Broadcast to everyone including the sender
    //   io.emit("chatMessage", message);
    // });

    // Handle user typing event
    socket.on("typing", (isTyping) => {
      socket.broadcast.emit("typing", isTyping);
    });

    socket.on("disconnect", async () => {
      const userId = socket.handshake.query.userId;
      const lastSeen = new Date();

      // Update the user's last seen timestamp in the database
      await UserModel.updateOne({ _id: userId }, { lastSeen });

      onlineUsers.delete(userId);
      io.emit("onlineUsers", Array.from(onlineUsers.values()));

      // Emit offline users list to all clients
      sendOfflineUsers(socket);
    });

    socket.on("messageSeen", async (messageId) => {
      await ChatMessageModel.updateOne({ _id: messageId }, { seen: true });
    });

    socket.on("joinRoom", (roomName) => {
      socket.join(roomName);
    });

    socket.on("leaveRoom", (roomName) => {
      socket.leave(roomName);
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

          const senderObjectId = new mongoose.Types.ObjectId(senderId);
          const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

          // Fetch private chat history where the sender and recipient match
          history = await ChatMessageModel.find({
            $or: [
              {
                "sender._id": senderObjectId,
                "recipient._id": recipientObjectId,
              },
              {
                "sender._id": recipientObjectId,
                "recipient._id": senderObjectId,
              },
            ],
          }).sort({ timestamp: 1 }); // Sorting by timestamp for chronological order
        } else {
          // If it's not a private chat, treat it as a public room and fetch messages by room name
          history = await ChatMessageModel.find({
            room: roomName, // Fetch messages where the room matches the public room name
          }).sort({ timestamp: 1 });
        }
        // Emit the chat history back to the client
        socket.emit("sendHistory", history);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        socket.emit("sendHistory", []); // Send an empty array if there's an error
      }
    });

    // socket.on("sendMessage", async (messageData) => {
    //   console.log("New message data:", messageData);

    //   // Store the message in the database
    //   await ChatMessageModel.create(messageData);

    //   // Emit the message to everyone in the room
    //   io.to(messageData.room).emit("message", messageData);
    // });

    socket.on("sendMessage", async (messageData) => {
      const recipientId = messageData?.recipient?._id;

      // Check if recipient is online
      if (onlineUsers.has(recipientId)) {
        await ChatMessageModel.create(messageData);
        // Emit the message to the recipient if they are online
        io.to(onlineUsers.get(recipientId).socketId).emit(
          "message",
          messageData
        );
      } else {
        // Store the message as unseen if the recipient is offline
        messageData.seen = false;
        await ChatMessageModel.create(messageData);

        console.log(`User ${recipientId} is offline. Message saved for later.`);
      }

      // Emit the message to the room (for group/public messages)
      io.to(messageData.room).emit("message", messageData);
    });

    const sendOfflineUsers = async (socket: Socket) => {
      // Get all users
      const allUsers = await UserModel.find({}, "_id username profile");

      // Filter out online users
      const offlineUsers = allUsers.filter(
        (user: any) => !onlineUsers.has(user._id.toString())
      );

      // Emit offline users list to the client
      socket.emit("offlineUsers", offlineUsers);
    };
  });
};
