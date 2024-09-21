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
import { ProfileModal } from "./ProfileModal";
import { TbLogout2 } from "react-icons/tb";

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
  setOfflineUsers: any;
  setOnlineUsers: any;
  setRooms: any;
  setRoom: any;
  setShownRoomName: any;
}

function ChatArea({
  offlineUsers,
  setOfflineUsers,
  onlineUsers,
  setOnlineUsers,
  socket,
  sender,
  recipient,
  room,
  shownRoomName,
  messages,
  message,
  setMessage,
  publicName,
  setRooms,
  setRoom,
  setShownRoomName,
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
  const recordedChunksRef = useRef<Blob[]>([]);

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

      socket.emit("sendMessage", messageData);

      setMessage("");
    } else {
      alert("Please select a room or user to send the message.");
    }
  };

  const addUserToRoom = (data: any) => {
    socket?.emit("joinRoom", data);
  };

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

  useEffect(() => {
    const typingTimeout = setTimeout(() => {
      socket?.emit("isTyping", {
        senderId: sender?._id,
        room,
        isTyping: false,
      });
    }, 1000);

    socket?.emit("isTyping", { senderId: sender?._id, room, isTyping: true });

    return () => clearTimeout(typingTimeout);
  }, [message]);

  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    socket?.on("typing", (data: any) => {
      const { senderId, isTyping } = data;

      setTypingUsers((prevTypingUsers) => ({
        ...prevTypingUsers,
        [senderId]: isTyping,
      }));
    });

    return () => {
      socket?.off("typing");
    };
  }, [socket]);

  const [open, setOpen] = useState(false); // Modal open state
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(
    null
  ); // Store selected recipient

  const profileHandler = (recipient: Recipient | null) => {
    if (recipient?.username) {
      // Ensure username is defined
      setSelectedRecipient(recipient);
      setOpen(true); // Open the modal
    } else {
      console.error("Username is required to view the profile");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRecipient(null);
  };

  const leaveRoomHandler = (room: Room, sender: string) => {
    if (room && room.roomName) {
      if (confirm("Are You Sure You Want To Do This??")) {
        socket?.emit("leaveRoom", { room: room._id, sender });
        setRoom(null);
        setShownRoomName("No room joined")
      }
    }
  };

  socket?.on("leftRoom", (rooms: Room) => {
    setRooms(rooms);
  });

  socket?.on("errorLeavingRoom", ({ room, error }: any) => {
    alert(`Error leaving room ${room}: ${error}`);
  });

  return (
    <div className="chat-area" style={{ fontFamily: "Poppins" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 30px",
        }}
      >
        <h2
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => recipient && profileHandler(recipient)}
        >
          {recipient?.profile ? (
            <img
              src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${recipient.profile}`}
              alt="Profile"
              className="avatar"
            />
          ) : (
            "Chat Room:"
          )}{" "}
          {typeof shownRoomName === "string"
            ? shownRoomName
            : typeof shownRoomName === "object"
              ? // @ts-ignore
                shownRoomName.roomName
              : "No room joined"}
          {Object.keys(typingUsers).map((userId) => {
            if (typingUsers[userId] && userId !== sender?._id) {
              return (
                <span
                  key={userId}
                  style={{
                    marginLeft: "5px",
                    fontWeight: "normal",
                    fontSize: "1rem",
                  }}
                >
                  (typing...)
                </span>
              );
            }
            return null;
          })}
        </h2>

        {typeof shownRoomName === "object" ? (
          <div
            style={{
              padding: "5px",
              cursor: "pointer",
              display: "flex",
              gap: "25px",
            }}
          >
            <div onClick={() => showModalHandler(shownRoomName)}>
              <FaUserPlus size={25} />
            </div>
            <div
              onClick={() => leaveRoomHandler(shownRoomName, sender?._id ?? "")}
            >
              <TbLogout2 size={27} />
            </div>
          </div>
        ) : (
          ""
        )}

        {selectedRecipient && (
          <ProfileModal
            recipient={selectedRecipient as Required<Recipient>} // Type casting
            open={open}
            handleClose={handleClose}
          />
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
