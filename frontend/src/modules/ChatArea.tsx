import { CiClock2 } from "react-icons/ci";
import { FaUserPlus } from "react-icons/fa";
import { Dialog } from "@mui/material";
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
import ChatInput from "./ChatInput";
import Swal from "sweetalert2";

interface ChatAreaProps {
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
  pinMessage: Message | null;
  setPinMessage: any;
  setEditMessage: any;
  editMessage: boolean;
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
  setRooms,
  setRoom,
  setShownRoomName,
  pinMessage,
  setPinMessage,
  setEditMessage,
  editMessage,
}: ChatAreaProps) {
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

  const addUserToRoom = (data: { userId: string; room: string }) => {
    const { userId } = data;

    socket?.emit("joinRoom", data);

    setNonParticipantOnlineUsers((prevUsers) =>
      prevUsers.filter((user) => user._id !== userId)
    );
    setNonParticipantOfflineUsers((prevUsers) =>
      prevUsers.filter((user) => user._id !== userId)
    );
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
    Swal.fire({
      title: "Delete Message",
      text: "Do you want to delete this message?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete for Everyone",
      cancelButtonText: "Cancel",
      showDenyButton: true,
      denyButtonText: "Delete for Me",
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Emit event to delete for everyone
        socket?.emit("deleteMessage", {
          messageId,
          userId: sender?._id,
          deleteForEveryone: true,
        });
      } else if (result.isDenied) {
        // Emit event to delete for me
        socket?.emit("deleteMessage", {
          messageId,
          userId: sender?._id,
          deleteForEveryone: false,
        });
      }
    });
  };

  const handlePinMessage = async (message: Message) => {
    Swal.fire({
      title: "Pin Message",
      text: "Do you want to pin this message?",
      icon: "question",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Pin",
    }).then((result: any) => {
      if (result.isConfirmed) {
        socket?.emit("pinMessage", {
          room,
          messageId: message._id,
        });
      }
    });
  };

  const handleSaveMessage = (message: Message) => {
    socket?.emit("saveMessage", { userId: sender?._id, message });
  };

  const handleEditMessage = (message: Message) => {
    if (sender?._id === message.sender._id) {
      setEditMessage(true);
      setMessage(message.content);
    } else {
      Swal.fire({
        title: "Edit Message",
        text: "You Can't Edit This Message",
        icon: "error",
        confirmButtonText: "Dismiss",
      });
    }
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
  );

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
        setShownRoomName("No room joined");
      }
    }
  };

  socket?.on("leftRoom", (rooms: Room) => {
    setRooms(rooms);
  });

  socket?.on("errorLeavingRoom", ({ room, error }: any) => {
    alert(`Error leaving room ${room}: ${error}`);
  });

  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

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

        {/* Pinned Message Section */}
        {pinMessage && (
          <div
            style={{
              backgroundColor: "#f0f0f0",
              borderRadius: "8px",
              padding: "10px",
              marginTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ margin: "0", fontWeight: "bold" }}>
                Pinned Message from {pinMessage?.sender?.username}
              </p>
              <p style={{ margin: "0", fontSize: "0.9rem" }}>
                {pinMessage?.content}
              </p>
            </div>
            <button
              onClick={() => setPinMessage(null)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                color: "red",
              }}
            >
              Unpin
            </button>
          </div>
        )}

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
                    onClick={() => addUserToRoom({ userId: user._id, room })} // Use room correctly here
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

          {/* Offline Users Section */}
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
                    onClick={() => addUserToRoom({ userId: user._id, room })} // Use room correctly here
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
                        {!msg.fileUrl && !msg.voiceUrl && (
                          <button
                            onClick={() => {
                              toggleOptions(msg._id ?? "");
                              handleCopyMessage(msg.content);
                            }}
                          >
                            Copy
                          </button>
                        )}

                        <button
                          onClick={() => {
                            toggleOptions(msg._id ?? "");
                            handlePinMessage(msg);
                          }}
                        >
                          Pin
                        </button>
                        <button
                          onClick={() => {
                            toggleOptions(msg._id ?? "");
                            handleSaveMessage(msg);
                          }}
                        >
                          Save
                        </button>
                        {!msg.fileUrl &&
                          !msg.voiceUrl &&
                          sender?._id === msg.sender._id && (
                            <button
                              onClick={() => {
                                toggleOptions(msg._id ?? "");
                                handleEditMessage(msg);
                              }}
                            >
                              Edit
                            </button>
                          )}
                        <button
                          onClick={() => {
                            toggleOptions(msg._id ?? "");
                            handleDeleteMessage(msg._id ?? "");
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
                {/* {msg.fileUrl && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent:
                        msg?.sender?._id === sender?._id ? "right" : "left",
                    }}
                  >
                    {/\.(jpg|jpeg|png|gif)$/i.test(msg.fileUrl) ? (
                      <img
                        src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${msg.fileUrl}`}
                        alt="Uploaded media"
                        style={{ maxWidth: "400px", borderRadius: "8px" }}
                      />
                    ) : /\.(mp4|mov|avi|wmv)$/i.test(msg.fileUrl) ? (
                      <video
                        src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${msg.fileUrl}`}
                        controls
                        style={{ maxWidth: "400px", borderRadius: "8px" }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <p>Unsupported file format</p>
                    )}
                  </div>
                )} */}

                {msg.fileUrl && (
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent:
                        msg?.sender?._id === sender?._id ? "right" : "left",
                    }}
                  >
                    {/\.(jpg|jpeg|png|gif)$/i.test(msg.fileUrl) ? (
                      <div>
                        {/* Thumbnail Image */}
                        <img
                          src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${msg.fileUrl}`}
                          alt="Uploaded media"
                          style={{
                            maxWidth: "400px",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                          onClick={toggleFullScreen} // Trigger full screen on click
                        />

                        {/* Full Screen Dialog */}
                        <Dialog
                          open={isFullScreen}
                          onClose={toggleFullScreen}
                          fullScreen
                        >
                          <img
                            src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${msg.fileUrl}`}
                            alt="Uploaded media in full screen"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              backgroundColor: "black",
                            }}
                            onClick={toggleFullScreen} // Toggle back to normal size on click
                          />
                        </Dialog>
                      </div>
                    ) : /\.(mp4|mov|avi|wmv)$/i.test(msg.fileUrl) ? (
                      <video
                        src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${msg.fileUrl}`}
                        controls
                        style={{ maxWidth: "400px", borderRadius: "8px" }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <p>Unsupported file format</p>
                    )}
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

      <ChatInput
        message={message}
        setMessage={setMessage}
        room={room}
        sender={sender}
        recipient={recipient}
        handleStartRecording={handleStartRecording}
        handleStopRecording={handleStopRecording}
        isRecording={isRecording}
        socket={socket}
        publicName={publicName}
        editMessage={editMessage}
      />
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
