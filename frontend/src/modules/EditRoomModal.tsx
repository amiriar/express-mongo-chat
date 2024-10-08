import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import { IoClose } from "react-icons/io5";
import { Room } from "./types/types";

interface EditRoomModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
  onSave: (updatedRoom: { roomName: string; bio: string }) => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  open,
  onClose,
  room,
  onSave,
}) => {
  const [roomName, setRoomName] = useState<string>(room?.roomName || "");
  const [bio, setBio] = useState<string>(room?.bio || "");

  const handleSave = () => {
    onSave({ roomName, bio });
    onClose();
  };

  useEffect(() => {
    if (room) {
      setRoomName(room.roomName || "");
      setBio(room.bio || "");
    }
  }, [room]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={"center"}
          mb={2}
        >
          <Typography variant="h6">Edit Room</Typography>
          <IconButton onClick={onClose} sx={{ width: "50px", height: "50px" }}>
            <IoClose size={25} />
          </IconButton>
        </Box>

        <TextField
          label="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 15 }}
        />

        <TextField
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 150 }}
        />

        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default EditRoomModal;
