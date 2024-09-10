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
        };

        // Add user to the map
        onlineUsers.set(userId, userInfo);

        // Emit updated online users list to all clients
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
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

    // Handle disconnection
    socket.on("disconnect", async () => {
      const userId = socket.handshake.query.userId;
      const lastSeen = new Date();

      // Store the last seen timestamp in your database
      await UserModel.updateOne({ _id: userId }, { lastSeen });

      onlineUsers.delete(userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
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

    socket.on("getHistory", async (data) => {
      try {
        const [senderId, recipientId] = data.split("-");
        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
          return socket.emit("sendHistory", []);
        }
    
        const history = await ChatMessageModel.find({
          sender: new mongoose.Types.ObjectId(senderId),
          recipient: new mongoose.Types.ObjectId(recipientId),
        });
    
        // Emit the chat history back to the client
        socket.emit("sendHistory", history);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    });
    

    socket.on("sendMessage", async (messageData) => {
      console.log(messageData); // Debug
      await ChatMessageModel.create(messageData);
      io.to(messageData.room).emit("message", messageData);
    });
  });
};
