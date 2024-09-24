import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Avatar,
} from "@mui/material";

// Define the Recipient type with optional fields
type Recipient = {
  username: string;
  profile?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  bio?: string;
  phoneNumber?: string;
};

export const ProfileModal = ({
  recipient,
  open,
  handleClose,
}: {
  recipient: Recipient;
  open: boolean;
  handleClose: () => void;
}) => {
  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <Avatar
        src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${recipient?.profile}`}
        alt={recipient.username}
        sx={{
          width: "100%",
          height: "300px",
          borderRadius: "0",
          objectFit: "cover",
        }}
      />
      <DialogTitle>{recipient.username}'s Profile</DialogTitle>
      <DialogContent>
        {recipient.firstname && (
          <Typography variant="body1">
            First Name: {recipient.firstname}
          </Typography>
        )}
        {recipient.lastname && (
          <Typography variant="body1">
            Last Name: {recipient.lastname}
          </Typography>
        )}
        <Typography variant="body1">Username: {recipient.username}</Typography>
        {recipient.email && (
          <Typography variant="body1">Email: {recipient.email}</Typography>
        )}
        {recipient.bio && (
          <Typography variant="body1">Bio: {recipient.bio}</Typography>
        )}
        {recipient.phoneNumber && (
          <Typography variant="body1">
            Phone: {recipient.phoneNumber}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};
