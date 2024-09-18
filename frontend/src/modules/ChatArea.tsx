import { v4 as uuidv4 } from "uuid";
import { CiClock2 } from "react-icons/ci";
import { FaMicrophone, FaStop, FaPaperPlane, FaUserPlus } from "react-icons/fa";
import {
  Modal,
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import { FaComments } from "react-icons/fa";
import { IUser, Message, Recipient, Room, Sender } from "./types/types";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import axios from "axios";

interface OnlineUsersProps {
  offlineUsers: IUser[];
  onlineUsers: IUser[];
  socket: typeof Socket | null;
  sender: Sender | null;
  recipient: Recipient | null;
  room: string;
  messages: Message[];
  shownRoomName: string;
  message: string;
  setMessage: any;
  publicName: string;
}

function ChatArea({
  offlineUsers,
  onlineUsers,
  socket,
  sender,
  recipient,
  room,
  shownRoomName,
  messages,
  message,
  setMessage,
  publicName,
}: OnlineUsersProps) {
  const [openModal, setOpenModal] = useState(false);

  const handleCloseModal = () => setOpenModal(false);

  const [nonParticipantOnlineUsers, setNonParticipantOnlineUsers] = useState<
    IUser[]
  >([]);
  const [nonParticipantOfflineUsers, setNonParticipantOfflineUsers] = useState<
    IUser[]
  >([]);

  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

      if (recipient) {
        messageData.recipient = {
          _id: recipient._id,
        };
      }

      // Add the message to the state with 'isSending' status
      // setMessages((prevMessages) => [...prevMessages, messageData as Message]);

      // Emit the message to the server
      socket.emit("sendMessage", messageData);

      setMessage("");
    } else {
      alert("Please select a room or user to send the message.");
    }
  };

  const addUserToRoom = (data: any) => {
    const { userId, room } = data;
    console.log(userId);
    console.log(room);
    socket?.emit("joinRoom", data);
  };

  const recordedChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = () => {
    setIsRecording(true);
    recordedChunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          console.log("Data available event triggered", event.data);
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
      })
      .catch((err) => console.error("Error accessing microphone:", err));
  };

  const handleStopRecording = () => {
    setIsRecording(false);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });

        if (blob.size === 0) {
          console.error("Blob is empty. Check recordedChunks.");
          return;
        }

        // Convert blob to FormData to send it as a file
        const formData = new FormData();
        formData.append("voiceMessage", blob, "voice-message.webm");

        const senderJson = JSON.stringify(sender?._id);
        const recipientJson = JSON.stringify(recipient && recipient?._id);
        const roomJson = JSON.stringify(room);

        formData.append("sender", senderJson);
        if (recipient) formData.append("recipient", recipientJson);
        formData.append("room", roomJson);

        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_BASE_URL}/api/messages/upload-voice`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            }
          );

          const mp3Url = response.data.filePath;
          socket?.emit("voice-message", {
            mp3Url,
            room,
            senderId: sender?._id,
          });
        } catch (error) {
          console.error("Error uploading voice message:", error);
        }
      };
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    socket?.emit("deleteMessage", messageId);
  };

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
  };

  const toggleOptions = (messageId: string) => {
    setSelectedMessageId(selectedMessageId === messageId ? null : messageId);
  };

  const showModalHandler = (room: Room) => {
    const onlineUsersNotInRoom = onlineUsers.filter(
      (user: any) =>
        !room.participants.some(
          (participantId: any) => participantId.toString() === user._id
        )
    );

    const offlineUsersNotInRoom = offlineUsers.filter(
      (user: any) =>
        !room.participants.some(
          (participantId: any) => participantId.toString() === user._id
        )
    );

    setNonParticipantOnlineUsers(onlineUsersNotInRoom);
    setNonParticipantOfflineUsers(offlineUsersNotInRoom);

    setOpenModal(true);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-area">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>
          Chat Room:{" "}
          {typeof shownRoomName === "string"
            ? shownRoomName
            : typeof shownRoomName === "object"
              ? // @ts-ignore
                shownRoomName.roomName
              : "No room joined"}
        </h2>
        {typeof shownRoomName === "object" ? (
          <div
            style={{
              padding: "5px",
              cursor: "pointer",
              display: "flex",
              gap: "15px",
            }}
            onClick={() => showModalHandler(shownRoomName)}
          >
            <FaUserPlus size={25} />
          </div>
        ) : (
          ""
        )}
      </div>
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
      >
        <Box sx={ModalStyle}>
          <Typography id="modal-title" variant="h6" component="h2">
            Add Users to Room
          </Typography>

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

      <div className="messages" style={{ overflowY: "scroll" }}>
        {room ? (
          messages.map((msg: Message) => {
            return (
              <div key={msg._id || msg.tempId} className="message-container">
                <div
                  className={`message ${
                    msg?.sender?._id === sender?._id ? "sent" : "received"
                  }`}
                  style={{ minWidth: "200px" }}
                >
                  <p
                    style={{
                      textAlign:
                        msg?.sender?._id === sender?._id ? "right" : "left",
                      marginTop: "0px",
                    }}
                  >
                    {msg?.sender?.username}
                  </p>
                  <p
                    style={{
                      textAlign:
                        msg?.sender?._id === sender?._id ? "right" : "left",
                      margin: "5px 0 0 0",
                      fontFamily: "IranYekan",
                      fontSize: "0.9rem",
                    }}
                  >
                    {msg?.content}
                  </p>
                  <p
                    className="timestamp"
                    style={{
                      textAlign:
                        msg?.sender?._id === sender?._id ? "left" : "right",
                      margin: "5px 0 0 0",
                    }}
                  >
                    {msg.isSending || !msg.timestamp ? (
                      <CiClock2 size={10} />
                    ) : msg.timestamp ? (
                      new Date(msg.timestamp).toLocaleTimeString()
                    ) : (
                      "Unknown Time"
                    )}
                  </p>
                  <div className="message-options">
                    <button
                      style={{
                        color: "red",
                        width: "20px",
                        position: "absolute",
                        top: "-5px",
                        right:
                          msg?.sender?._id === sender?._id ? "100%" : "-35px",
                      }}
                      onClick={() => toggleOptions(msg._id ?? "")}
                    >
                      ⋮
                    </button>
                    {selectedMessageId === msg._id && (
                      <div
                        className="options-dropdown"
                        style={{
                          position: "absolute",
                          top: "35px",
                          right:
                            msg.sender._id === sender?._id ? "100%" : "-35px",
                        }}
                      >
                        <button
                          onClick={() => {
                            handleCopyMessage(msg.content);
                            toggleOptions(msg._id ?? "");
                          }}
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => {
                            toggleOptions(msg._id ?? "");
                            if (
                              confirm(
                                "Do You Really Want To Delete This Message??"
                              )
                            ) {
                              handleDeleteMessage(msg._id ?? "");
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {msg.voiceUrl && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent:
                        msg?.sender?._id === sender?._id ? "right" : "left",
                    }}
                  >
                    <audio className="audio-player" controls>
                      <source
                        src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${msg.voiceUrl}`}
                        type="audio/mp3"
                      />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-room-message" style={styles.noRoomMessage}>
            <FaComments size={40} style={{ marginBottom: "10px" }} />
            <p style={{ fontSize: "18px" }}>Join a room to start chatting!</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form
        className="message-input"
        onSubmit={sendMessage}
        style={styles.form}
      >
        <input
          value={room ? message : ""}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            room ? "Type your message..." : "Join a room to send a message!"
          }
          className="input-field"
          style={styles.inputField}
          disabled={!room}
        />
        <div
          className="voice-message-controls"
          style={styles.voiceMessageControls}
        >
          {!isRecording ? (
            <div
              style={{
                boxSizing: "border-box",
                padding: "5px",
                cursor: "pointer",
                display: room ? "flex" : "none",
              }}
              onClick={handleStartRecording}
            >
              <FaMicrophone style={styles.icon} />
            </div>
          ) : (
            <div
              style={{
                boxSizing: "border-box",
                padding: "5px",
                cursor: "pointer",
                display: room ? "flex" : "none",
              }}
              onClick={handleStopRecording}
            >
              <FaStop style={styles.icon} />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="send-btn"
          style={styles.sendBtn}
          disabled={!room}
        >
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
}

const styles = {
  noRoomMessage: {
    display: "flex" as const,
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    height: "100%",
    textAlign: "center" as const,
    color: "#888",
  },
  form: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "10px",
    backgroundColor: "#f0f0f0",
    borderRadius: "10px",
  },
  inputField: {
    flex: 8,
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    marginRight: "10px",
    fontSize: "16px",
  },
  voiceMessageControls: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginRight: "10px",
  },
  sendBtn: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    padding: "10px",
    cursor: "pointer",
  },
  icon: {
    fontSize: "24px",
    color: "#333",
  },
};

const ModalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default ChatArea;
