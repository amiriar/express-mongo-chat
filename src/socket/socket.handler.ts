import mongoose from "mongoose";
import ChatMessageModel from "../module/models/chatMessage.model";
import UserModel from "../module/models/user.model";
import { Server, Socket } from "socket.io";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const handleSocketConnections = (io: Server) => {
  const onlineUsers = new Map();
  io.on("connection", (socket: Socket) => {
    console.log(`New user connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    onlineUsers.set(userId, socket.id);

    UserModel.findById(userId).then(async (user) => {
      if (user) {
        // const userInfo = {
        //   _id: user._id,
        //   // username: user.username,
        //   // profile: user.profile,
        //   // phone: user.phoneNumber,
        // };
        const userData = await UserModel.findOne(
          { _id: user?._id },
          { username: 1, phoneNumber: 1, id: 1, profile: 1 }
        );

        // Add user to the map
        onlineUsers.set(userId, userData);

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
                sender: senderObjectId,
                recipient: recipientObjectId,
              },
              {
                sender: recipientObjectId,
                recipient: senderObjectId,
              },
            ],
          })
            .populate("sender", "username profile phoneNumber") // Populate sender details
            .populate("recipient", "username profile phoneNumber") // Populate recipient details
            .sort({ timestamp: 1 }); // Sorting by timestamp for chronological order
        } else {
          // If it's not a private chat, treat it as a public room and fetch messages by room name
          history = await ChatMessageModel.find({
            room: roomName, // Fetch messages where the room matches the public room name
          })
            .populate("sender", "username profile phoneNumber") // Populate sender details
            .populate("recipient", "username profile phoneNumber") // Populate recipient details
            .sort({ timestamp: 1 });
        }
        // Emit the chat history back to the client with populated user details
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

    // socket.on("sendMessage", async (messageData) => {
    //   if (onlineUsers.has(messageData?.recipient)) {
    //     await ChatMessageModel.create(messageData);
    //     // Emit the message to the recipient if they are online
    //     io.to(onlineUsers.get(messageData?.recipient).socketId).emit(
    //       "message",
    //       messageData
    //     );
    //   } else {
    //     // Store the message as unseen if the recipient is offline
    //     messageData.seen = false;
    //     await ChatMessageModel.create(messageData);

    //     console.log(
    //       `User ${messageData?.recipient} is offline. Message saved for later.`
    //     );
    //   }

    //   // Emit the message to the room (for group/public messages)
    //   io.to(messageData.room).emit("message", messageData);
    // });
    socket.on("sendMessage", async (messageData) => {
      try {
        // Save the message to the database
        const newMessage = await ChatMessageModel.create(messageData);

        // Populate the sender and recipient data
        const sender = await UserModel.findById(
          newMessage.sender,
          "username profile"
        );
        const recipient = await UserModel.findById(
          newMessage.recipient,
          "username profile"
        );

        // Prepare the message to be sent back to the frontend
        const messageToSend = {
          _id: newMessage._id,
          content: newMessage.content,
          room: newMessage.room,
          timestamp: newMessage.timestamp,
          status: newMessage.status,
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

        // Emit the message to the recipient and the room
        io.to(messageToSend.room).emit("message", messageToSend);
      } catch (error) {
        console.error("Error sending message:", error);
      }
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

    // socket.on("voice-message", (audioArrayBuffer: ArrayBuffer) => {
    //   // Log the type and content to debug the issue
    //   console.log("Type of received audio data:", typeof audioArrayBuffer);
    //   console.log("Received audio data:", audioArrayBuffer);

    //   // Check if the received data is a valid ArrayBuffer
    //   if (audioArrayBuffer instanceof ArrayBuffer) {
    //     // Convert the ArrayBuffer to a Buffer
    //     const audioBuffer = Buffer.from(audioArrayBuffer);

    //     // Generate a unique filename for the audio
    //     const fileName = `audio_${uuidv4()}.mp3`;

    //     const audioUploadPath = path.join(
    //       __dirname,
    //       "..",
    //       "..",
    //       "public",
    //       "uploads",
    //       "audio"
    //     );

    //     if (!fs.existsSync(audioUploadPath)) {
    //       fs.mkdirSync(audioUploadPath, { recursive: true });
    //     }

    //     // Save the audio file
    //     fs.writeFileSync(`${audioUploadPath}/${fileName}`, audioBuffer);

    //     // Broadcast the voice message to other users

    //     // socket.emit("voice-message", { mp3Url: `/uploads/${fileName}` });
    //     socket.broadcast.emit("voice-message", { audioUploadPath, fileName });
    //   } else {
    //     console.error("Invalid data type received, expected ArrayBuffer.");
    //   }
    // });

    socket.on(
      "voice-message",
      async (audioArrayBuffer: ArrayBuffer, messageData) => {
        try {
          const audioBuffer = Buffer.from(audioArrayBuffer);
          const fileName = `audio_${uuidv4()}.mp3`;
          const audioUploadPath = path.join(
            __dirname,
            "..",
            "..",
            "public",
            "uploads",
            "audio"
          );

          if (!fs.existsSync(audioUploadPath)) {
            fs.mkdirSync(audioUploadPath, { recursive: true });
          }

          fs.writeFileSync(`${audioUploadPath}/${fileName}`, audioBuffer);

          const voiceUrl = `/uploads/audio/${fileName}`;

          // Store the message with voiceUrl in the database
          messageData.voiceUrl = voiceUrl;
          const newMessage = await ChatMessageModel.create(messageData);

          // Populate sender and recipient
          const sender = await UserModel.findById(
            newMessage.sender,
            "username profile"
          );
          const recipient = await UserModel.findById(
            newMessage.recipient,
            "username profile"
          );

          const messageToSend = {
            ...newMessage.toObject(),
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

          // Emit the voice message
          io.to(messageData.room).emit("voice-message", messageToSend);
        } catch (error) {
          console.error("Error saving voice message:", error);
        }
      }
    );
  });
};
