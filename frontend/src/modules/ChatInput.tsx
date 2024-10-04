import { InputAdornment, TextField } from "@mui/material";
import { MdOutlineAttachFile, MdOutlineModeEditOutline } from "react-icons/md";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Message } from "./types/types";

const ChatInput = ({
  room,
  message,
  setMessage,
  sender,
  recipient,
  handleStartRecording,
  handleStopRecording,
  isRecording,
  socket,
  publicName,
  editMessage,
  setEditMessage,
  setReplyMessage,
  replyMessage,
}: any) => {
  const uploadFileHandler = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const senderData = {
        _id: sender?._id,
        username: sender?.username,
        profile: sender?.profile,
      };
      const recipientData = {
        _id: recipient?._id,
        username: recipient?.username,
        profile: recipient?.profile,
      };

      const formData = new FormData();
      formData.append("sender", JSON.stringify(senderData));
      recipient && formData.append("recipient", JSON.stringify(recipientData));
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

      const fileUrl = await response.data.fileUrl;

      socket?.emit("fileUpload", {
        fileUrl: fileUrl,
        sender: senderData,
        room,
        ...(recipientData && { recipient: recipientData }),
      });

      console.log("File uploaded:", fileUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const sendMessage = (e: any) => {
    e.preventDefault();
    if (!message.trim()) return alert("Please write something down.");

    if (socket && room) {
      const tempId = uuidv4();
      const messageData: Partial<Message> = {
        tempId,
        sender: {
          _id: sender?._id ?? "",
          username: sender?.username ?? "unknown",
        },
        content: message,
        room: room,
        publicName: publicName,
        isSending: true,
      };

      if (replyMessage) {
        messageData.replyTo = replyMessage._id;
      }

      if (recipient) {
        messageData.recipient = {
          _id: recipient._id,
        };
      }

      if (editMessage) {
        messageData._id = editMessage._id;

        setEditMessage(null);

        socket.emit("editMessage", { messageData });
      } else {
        setReplyMessage(null);
        socket.emit("sendMessage", messageData);
      }
      setMessage("");
    } else {
      alert("Please select a room or user to send the message.");
    }
  };

  return (
    <form
      className="message-input"
      style={{ display: "flex", alignItems: "center", flexDirection: "column" }}
      onSubmit={sendMessage}
    >
      <TextField
        value={room ? message : ""}
        sx={{ fontFamily: "IranYekan" }}
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
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: "none", fontFamily: "IranYekan" }}
                id="file-upload"
                onChange={uploadFileHandler}
              />
              <label
                htmlFor="file-upload"
                style={{
                  cursor: "pointer",
                  display: room ? "flex" : "none",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  top: "4px",
                }}
              >
                <MdOutlineAttachFile size={24} style={{ padding: "5px" }} />
              </label>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <button
                type="button"
                disabled={!room}
                style={{
                  border: "none",
                  background: "none",
                  display: room ? "flex" : "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {!isRecording ? (
                  <FaMicrophone
                    style={styles.icon}
                    onClick={handleStartRecording}
                  />
                ) : (
                  <FaStop style={styles.icon} onClick={handleStopRecording} />
                )}
              </button>

              <button
                type="submit"
                disabled={!room}
                style={{
                  border: "none",
                  background: "none",
                  display: room ? "flex" : "none",
                  cursor: "pointer",
                  padding: 0,
                  marginLeft: "20px",
                }}
              >
                {editMessage ? (
                  <MdOutlineModeEditOutline style={styles.icon} />
                ) : (
                  <IoSend style={styles.icon} />
                )}
              </button>
            </InputAdornment>
          ),
        }}
      />
    </form>
  );
};

const styles = {
  icon: {
    fontSize: "24px",
    color: "#333",
    cursor: "pointer",
  },
};

export default ChatInput;
