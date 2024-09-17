import { Socket } from "socket.io";
import UserModel from "../../module/models/user.model";
import RoomModel from "../../module/models/rooms.model";

export const userEvents = (
  socket: Socket,
  io: any,
  onlineUsers: Map<string, string>
) => {
  socket.on("login", async (userId: string) => {
    try {
      const user = await UserModel.findById(userId, "username");
      if (!user) return socket.emit("error", "User not found");

      onlineUsers.set(userId, socket.id);
      io.emit("onlineUsers", Array.from(onlineUsers.values()));

      const publicRooms = await RoomModel.find({
        roomName: { $in: ["General", "Announcements"] },
      });
      publicRooms.forEach((room: any) => socket.join(room._id.toString()));

      const userRooms = await RoomModel.find({
        participants: { $in: [userId] },
      });
      socket.emit("userRooms", userRooms);
      userRooms.forEach((room: any) => socket.join(room._id.toString()));
    } catch (error) {
      console.error("Error logging in user:", error);
      socket.emit("error", "Login failed");
    }
  });

  socket.on("typing", (isTyping) => {
    socket.broadcast.emit("typing", isTyping);
  });

  socket.on("disconnect", async () => {
    const userId = socket.handshake.query.userId;
    if (userId)
      await UserModel.updateOne({ _id: userId }, { lastSeen: new Date() });
    // @ts-ignore
    onlineUsers.delete(userId);
    io.emit("onlineUsers", Array.from(onlineUsers.values()));
  });
};
