import RoomModel from "../../module/models/rooms.model";

export const createPublicRooms = async () => {
    const defaultRooms = ["General", "Announcements"];
    
    for (const roomName of defaultRooms) {
      // Check if the room already exists
      const roomExists = await RoomModel.findOne({ roomName });
      if (!roomExists) {
        // Create the room if it doesn't exist
        const newRoom = new RoomModel({
          roomName,
          participants: [],
          isGroup: true,
          createdAt: new Date(),
        });
        await newRoom.save();
        console.log(`Public room '${roomName}' created.`);
      } else {
        console.log(`Public room '${roomName}' already exists.`);
      }
    }
  };