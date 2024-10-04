import {
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Modal,
  Typography,
} from "@mui/material";
import { IUser } from "./types/types";
import { FaUserPlus } from "react-icons/fa";

function JoinRoomModal({
  nonParticipantOnlineUsers,
  openModal,
  handleCloseModal,
  nonParticipantOfflineUsers,
  addUserToRoom,
  room,
  ModalStyle
}: any) {
  return (
    <Modal
      open={openModal}
      onClose={handleCloseModal}
      aria-labelledby="modal-title"
    >
      <Box sx={ModalStyle}>
        <Typography id="modal-title" variant="h6" component="h2">
          Add Users to Room
        </Typography>

        {/* Online Users Section */}
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Online Users
        </Typography>
        <List>
          {nonParticipantOnlineUsers.length > 0 ? (
            nonParticipantOnlineUsers.map((user: IUser) => (
              <ListItem
                key={user._id}
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`}
                    alt={user.username}
                  />
                </ListItemAvatar>
                <ListItemText primary={user.username} />
                <Button
                  onClick={() => addUserToRoom({ userId: user._id, room })} 
                  sx={{ width: "auto" }}
                >
                  <FaUserPlus size={20} />
                </Button>
              </ListItem>
            ))
          ) : (
            <Typography>No online users to add.</Typography>
          )}
        </List>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Offline Users
        </Typography>
        <List>
          {nonParticipantOfflineUsers.length > 0 ? (
            nonParticipantOfflineUsers.map((user: IUser) => (
              <ListItem
                key={user._id}
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`}
                    alt={user.username}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={user.username}
                  // @ts-ignore
                  secondary={`Last seen: ${new Date(user?.lastSeen).toLocaleString()}`}
                />
                <Button
                  onClick={() => addUserToRoom({ userId: user._id, room })}
                  sx={{ width: "auto" }}
                >
                  <FaUserPlus size={20} />
                </Button>
              </ListItem>
            ))
          ) : (
            <Typography>No offline users to add.</Typography>
          )}
        </List>
      </Box>
    </Modal>
  );
}

export default JoinRoomModal;
