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
import { FaPaperPlane } from "react-icons/fa";

export default function ForwardModal({
  offlineUsers,
  onlineUsers,
  ModalStyle,
  socket,
  openForwardModal,
  setOpenForwardModal,
  handleOpenForwardModal,
  handleCloseForwardModal,
  sender,
}: any) {
  const forwardMessageToUser = (userId: string) => {
    console.log(`Message forwarded to: ${sender._id}-${userId}`);
    socket?.io("forwardMessage", "");
  };

  return (
    <Modal
      open={openForwardModal}
      onClose={handleCloseForwardModal}
      aria-labelledby="forward-modal-title"
    >
      <Box sx={ModalStyle}>
        <Typography id="forward-modal-title" variant="h6" component="h2">
          Forward Message
        </Typography>

        {/* Online Users Section */}
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Online Users
        </Typography>
        <List>
          {onlineUsers.length > 0 ? (
            onlineUsers.map((user: IUser) => (
              <ListItem
                key={user._id}
                sx={{ display: "flex", justifyContent: "space-between" }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={
                      user._id === sender?._id
                        ? `${import.meta.env.VITE_BACKEND_BASE_URL}/public/static/savedMessages/saved-messages.jpg`
                        : `${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`
                    }
                    alt={user.username}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    user.username === sender.username
                      ? "Save Messages"
                      : user.username
                  }
                />
                <Button
                  onClick={() => forwardMessageToUser(user._id)} // New forwarding function
                  sx={{ width: "auto" }}
                >
                  <FaPaperPlane size={20} />
                </Button>
              </ListItem>
            ))
          ) : (
            <Typography>
              No online users available to forward the message.
            </Typography>
          )}
        </List>

        {/* Offline Users Section */}
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Offline Users
        </Typography>
        <List>
          {offlineUsers.length > 0 ? (
            offlineUsers.map((user: IUser) => (
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
                  onClick={() => forwardMessageToUser(user._id)} // Same forward function for offline users
                  sx={{ width: "auto" }}
                >
                  <FaPaperPlane size={20} />
                </Button>
              </ListItem>
            ))
          ) : (
            <Typography>
              No offline users available to forward the message.
            </Typography>
          )}
        </List>
      </Box>
    </Modal>
  );
}
