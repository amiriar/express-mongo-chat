import { Socket } from "socket.io";
import RoomModel, { IRoom } from "../../module/models/rooms.model";

export const roomEvents = (socket: Socket, io: any) => {
  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
  });

  socket.on("leaveRoom", (roomName) => {
    socket.leave(roomName);
  });

  socket.on("createRoom", async (roomName, userId) => {
    const room = await RoomModel.create({ roomName, participants: [userId] }) as any;
    socket.join(room._id.toString());
    io.emit("newRoomCreated", room);
  });
};
