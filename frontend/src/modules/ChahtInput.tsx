import { InputAdornment, TextField } from "@mui/material";
import { MdOutlineAttachFile } from "react-icons/md";
import axios from "axios";

const ChatInput = ({ room, message, setMessage, sender, recipient }: any) => {
  const uploadFileHandler = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("sender", sender?._id);
      formData.append("recipient", recipient?._id);
      formData.append("room", room);
      formData.append("file", file);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/messages/upload-file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      const fileUrl = response.data.fileUrl;

      console.log("File uploaded:", fileUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <form
      className="message-input"
      style={{ display: "flex", alignItems: "center" }}
    >
      {/* Input for text message */}
      <TextField
        value={room ? message : ""}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          room ? "Type your message..." : "Join a room to send a message!"
        }
        fullWidth
        variant="outlined"
        disabled={!room}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {/* Hidden file input for uploading */}
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: "none" }} // Hide the input
                id="file-upload"
                onChange={uploadFileHandler} // Automatically upload on file selection
              />
              {/* Clickable attach icon */}
              <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
                <MdOutlineAttachFile size={24} style={{ padding: "5px" }} />
              </label>
            </InputAdornment>
          ),
        }}
      />

      {/* Send button or additional controls */}
      <button type="submit" disabled={!room}>
        Send
      </button>
    </form>
  );
};

export default ChatInput;
