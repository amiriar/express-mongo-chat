import mongoose from "mongoose";
import ChatMessageModel from "../module/models/chatMessage.model";
import UserModel, { IUser } from "../module/models/user.model";
import { Server, Socket } from "socket.io";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import RoomModel from "../module/models/rooms.model";
import { createPublicRooms } from "../common/helper/Helper";

export const handleSocketConnections = (io: Server) => {
  const onlineUsers = new Map();
  io.on("connection", async (socket: Socket) => {
    console.log(`New user connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    onlineUsers.set(userId, socket.id);

    let User: IUser | null;

    createPublicRooms();

    socket.on("isTyping", (data) => {
      const { senderId, room, isTyping } = data;
      socket.to(room).emit("typing", { senderId, isTyping });
    });

    socket.on("disconnect", async () => {
      const userId = socket.handshake.query.userId;
      const lastSeen = new Date();

      await UserModel.updateOne({ _id: userId }, { lastSeen });

      onlineUsers.delete(userId);
      io.emit("onlineUsers", Array.from(onlineUsers.values()));

      sendOfflineUsers(socket);
    });

    socket.on("messageSeen", async (messageId) => {
      await ChatMessageModel.updateOne({ _id: messageId }, { seen: true });
    });

    socket.on("joinRoom", async (data) => {
      const { userId, room } = data;
      if (!userId) {
        socket.join(data);
      } else {
        await RoomModel.updateOne(
          { _id: room._id },
          { $addToSet: { participants: userId } }
        );
        const rooms = await RoomModel.find({ participants: { $in: [userId] } });
        io.emit("newRoomResponse", rooms);
      }
    });

    socket.on("leaveRoom", async ({room, sender}) => {
      try {
        socket.leave(room);

        await RoomModel.updateOne(
          { _id: room },
          { $pull: { participants: sender } } // $pull removes the sender from participants array
        );

        const rooms = await RoomModel.find(
          { participants: { $in: [sender] } },
          {}
        );

        socket.emit("leftRoom", rooms);
      } catch (error: any) {
        console.error("Error leaving room:", error);
        socket.emit("errorLeavingRoom", { room, error: error.message });
      }
    });

    socket.on("getHistory", async (roomName) => {
      try {
        const ids = !roomName._id ? roomName?.split("-") : roomName._id;
        const isPrivateChat =
          ids.length === 2 &&
          ids.every((id: string) => mongoose.Types.ObjectId.isValid(id));

        let history = [];

        if (isPrivateChat) {
          const [senderId, recipientId] = ids;

          const senderObjectId = new mongoose.Types.ObjectId(senderId);
          const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

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
            .populate("sender", "username profile phoneNumber")
            .populate("recipient", "username profile phoneNumber")
            .sort({ timestamp: 1 });
        } else {
          history = await ChatMessageModel.find({
            room: roomName,
          })
            .populate("sender", "username profile phoneNumber")
            .populate("recipient", "username profile phoneNumber")
            .sort({ timestamp: 1 });
        }
        socket.emit("sendHistory", history);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        socket.emit("sendHistory", []);
      }
    });

    socket.on("sendMessage", async (messageData) => {
      try {
        // Remove tempId before saving the message, as Mongoose will generate the _id
        const { tempId, ...rest } = messageData;

        const newMessage = await ChatMessageModel.create(rest); // Mongoose will auto-generate _id

        const sender = await UserModel.findById(
          newMessage.sender,
          "username profile"
        );
        const recipient = await UserModel.findById(
          newMessage.recipient,
          "username profile"
        );

        const messageToSend = {
          _id: newMessage._id, // Use the generated _id
          tempId, // Send the tempId back to update the message in the frontend
          content: newMessage.content,
          room: newMessage.room,
          timestamp: newMessage.timestamp, // Now has the real timestamp
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

        // socket.to(newMessage.room).emit('message', messageToSend);
        io.to(newMessage.room).emit("message", messageToSend);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("deleteMessage", async (messageId) => {
      await ChatMessageModel.deleteOne({ _id: messageId })
        .then(() => {
          io.emit("deleteMessageResponse", { success: true, messageId });
        })
        .catch((err) => {
          io.emit("deleteMessageResponse", {
            success: false,
            error: err.message,
          });
        });
    });

    socket.on("newRoom", async (data: any) => {
      const { roomName, senderId } = data;

      await RoomModel.create({
        roomName,
        participants: [senderId],
        isGroup: true,
        isPublic: false,
      });

      const rooms = await RoomModel.find({
        $or: [
          { isPublic: true },
          { participants: { $in: [User?._id?.toString()] } },
        ],
      }).select("_id roomName isGroup createdAt participants");

      io.emit("newRoomResponse", rooms);
    });

    const sendOfflineUsers = async (socket: Socket) => {
      const allUsers = await UserModel.find(
        {},
        "_id username profile lastSeen bio lastname firstname email"
      );

      const offlineUsers = allUsers.filter(
        (user: any) => !onlineUsers.has(user._id.toString())
      );

      socket.emit("offlineUsers", offlineUsers);
    };

    await UserModel.findById(userId).then(async (user) => {
      if (user) {
        User = await UserModel.findOne(
          { _id: user?._id },
          {
            username: 1,
            phoneNumber: 1,
            id: 1,
            profile: 1,
            lastSeen: 1,
            email: 1,
            firstname: 1,
            lastname: 1,
            bio: 1,
          }
        );

        onlineUsers.set(userId, User);

        io.emit("onlineUsers", Array.from(onlineUsers.values()));

        sendOfflineUsers(socket);
      }
    });

    socket.on("login", async (userId: string) => {
      try {
        const user = await UserModel.findById(userId).select("_id username");

        if (!user) {
          return socket.emit("error", "User not found");
        }

        console.log(`User ${User?.username} logged in`);

        const publicRooms = await RoomModel.find({
          roomName: { $in: ["General", "Announcements"] },
        }).select("_id roomName");

        publicRooms.forEach(async (room: any) => {
          socket.join(room._id.toString());

          await RoomModel.updateOne(
            { _id: room._id },
            { $addToSet: { participants: User?._id } }
          );

          console.log(`User ${User?.username} joined ${room.roomName}`);
        });

        // publicRooms.forEach((room: any) => {
        //   socket.join(room._id.toString());

        //   socket.to(room._id.toString()).emit("userJoinedRoom", {
        //     roomId: room._id,
        //     message: `${User?.username} joined ${room.roomName}`,
        //   });
        // });

        // socket.emit("publicRooms", publicRooms);

        const userRooms = await RoomModel.find({
          $or: [
            { isPublic: true },
            { participants: { $in: [User?._id?.toString()] } },
          ],
        }).select("_id roomName isGroup createdAt participants");

        socket.emit("userRooms", userRooms);

        userRooms.forEach((room: any) => {
          socket.join(room._id.toString());
        });
      } catch (err) {
        console.error("Error logging in user:", err);
        socket.emit("error", "Login failed");
      }
    });

    socket.on("voice-message", async (data: any) => {
      try {
        const { mp3Url, room, senderId } = data;

        if (!mp3Url || !room || !senderId) {
          throw new Error("Missing data");
        }

        const messageData = {
          voiceUrl: mp3Url,
          room: room._id ? room._id : room,
          sender: senderId,
        };

        const newMessage = await ChatMessageModel.create(messageData);

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
        io.to(room._id ? room._id : room).emit(
          "voice-message-response",
          messageToSend
        );
      } catch (error) {
        console.error("Error processing voice message:", error);
      }
    });
  });
};
