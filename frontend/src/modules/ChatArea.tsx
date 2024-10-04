import { CiClock2 } from "react-icons/ci";
import { FaChevronDown, FaReply, FaUserPlus } from "react-icons/fa";
import { Dialog } from "@mui/material";

import { RxCross2 } from "react-icons/rx";
import { IUser, Message, Recipient, Room, Sender } from "./types/types";
import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import axios from "axios";
import { ProfileModal } from "./ProfileModal";
import { TbLogout2 } from "react-icons/tb";
import ChatInput from "./ChatInput";
import Swal from "sweetalert2";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { GrFormPin } from "react-icons/gr";
import { IoIosChatbubbles } from "react-icons/io";
import ForwardModal from "./ForwardModal";
import JoinRoomModal from "./JoinRoomModal";
import { RiShareForwardFill } from "react-icons/ri";

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
  setMessages: any;
  publicName: string;
  setOfflineUsers: any;
  setOnlineUsers: any;
  setRooms: any;
  setRoom: any;
  setShownRoomName: any;
  pinMessage: Message | null;
  setPinMessage: any;
  setEditMessage: any;
  editMessage: Message | null;
  replyMessage: Message | null;
  setReplyMessage: any;
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
  setMessages,
  publicName,
  setRooms,
  setRoom,
  setShownRoomName,
  setPinMessage,
  setEditMessage,
  editMessage,
  replyMessage,
  setReplyMessage,
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

  const [selectedMessageToForward, setSelectedMessageToForward] =
    useState<Message | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const pinnedMessageRef = useRef<HTMLDivElement | null>(null);
  const pinnedMessageDisplayRef = useRef<HTMLDivElement | null>(null);
  const [currentPinnedMessage, setCurrentPinnedMessage] =
    useState<Message | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [openForwardModal, setOpenForwardModal] = useState(false);

  useEffect(() => {
    socket?.on("pinMessageResponse", ({ room: responseRoom, message }: any) => {
      if (room === responseRoom) {
        setPinMessage(message);

        setMessages((prevMessages: any) =>
          prevMessages.map((msg: Message) =>
            msg._id === message._id
              ? { ...msg, isPinned: true }
              : { ...msg, isPinned: false }
          )
        );
      }
    });

    socket?.on(
      "unpinMessageResponse",
      ({ room: responseRoom, message }: any) => {
        if (room === responseRoom) {
          setPinMessage(null);

          setMessages((prevMessages: any) =>
            prevMessages.map((msg: Message) =>
              msg._id === message._id ? { ...msg, isPinned: false } : msg
            )
          );
        }
      }
    );

    return () => {
      socket?.off("pinMessageResponse");
      socket?.off("unpinMessageResponse");
    };
  }, [room, socket]);

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
    if (message.isPinned) {
      Swal.fire({
        title: "Unpin Message",
        text: "Do you want to unpin this message?",
        icon: "question",
        showCancelButton: true,
        cancelButtonText: "Cancel",
        confirmButtonText: "Unpin",
      }).then((result: any) => {
        if (result.isConfirmed) {
          socket?.emit("unpinMessage", {
            room,
            messageId: message._id,
          });
        }
      });
    } else {
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
    }
  };

  const handleForwardMessage = (message: Message) => {
    setSelectedMessageToForward(message);
    handleOpenForwardModal();
  };

  const handleSaveMessage = (message: Message) => {
    Swal.fire({
      title: "Save Message",
      text: "Do you want to save this message?",
      icon: "question",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Save",
    }).then((result: any) => {
      if (result.isConfirmed) {
        socket?.emit("saveMessage", { recipientId: sender?._id, message });
      }
    });
  };

  const handleEditMessage = (message: Message) => {
    if (sender?._id === message.sender._id) {
      setEditMessage(message);
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

  useEffect(() => {
    const firstPinnedMessage = messages.find((msg: Message) => msg.isPinned);
    setCurrentPinnedMessage(firstPinnedMessage || null);
  }, [messages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && currentPinnedMessage) {
            pinnedMessageDisplayRef.current?.classList.add("show");
          } else {
            pinnedMessageDisplayRef.current?.classList.remove("show");
          }
        });
      },
      { threshold: 0.1 }
    );

    if (pinnedMessageRef.current) {
      observer.observe(pinnedMessageRef.current);
    }

    return () => {
      if (pinnedMessageRef.current) {
        observer.unobserve(pinnedMessageRef.current);
      }
    };
  }, [currentPinnedMessage]);

  const scrollToPinnedMessage = () => {
    if (pinnedMessageRef.current) {
      pinnedMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleReplyMessage = (message: Message) => {
    setReplyMessage(message);
  };

  const handleOpenForwardModal = () => {
    setOpenForwardModal(true);
  };

  const handleCloseForwardModal = () => {
    setOpenForwardModal(false);
  };

  const forwardMessageToUser = (userTo: IUser, message: Message) => {
    socket?.emit("forwardMessage", { message, userTo: userTo._id, senderId: sender?._id });
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

      {room ? (
        <div
          className="messages"
          style={{ overflowY: "scroll", height: "100%" }}
        >
          {currentPinnedMessage && (
            <div
              onClick={scrollToPinnedMessage}
              ref={pinnedMessageDisplayRef}
              style={{
                cursor: "pointer",
                position: "sticky",
                top: "0",
                zIndex: 1,
                backgroundColor: "#ffffff",
                padding: "3px 10px",
                marginBottom: "10px",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.1)",
              }}
              className="pinned-message-display"
            >
              <div>
                <p style={{ margin: "0", fontWeight: "bold" }}>
                  Pinned Message from {currentPinnedMessage?.sender?.username}:
                </p>
                <p style={{ margin: "0", fontSize: "0.9rem" }}>
                  {currentPinnedMessage?.content}
                </p>
              </div>

              <button
                style={{
                  backgroundColor: "transparent",
                  width: "100px",
                  border: "none",
                  color: "#000",
                }}
              >
                <GrFormPin size={30} />
              </button>
            </div>
          )}

          {messages.map((msg: Message) => {
            return (
              <div
                key={msg._id || msg.tempId}
                className="message-container"
                ref={msg.isPinned ? pinnedMessageRef : null}
              >
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
                  {msg.replyTo && (
                    <p
                      className="message-reply"
                      style={{
                        backgroundColor:
                          msg?.sender?._id === sender?._id
                            ? "#c5e8fa"
                            : "#f9ede4",
                      }}
                    >
                      <span
                        style={{
                          textAlign:
                            msg?.sender?._id === sender?._id ? "right" : "left",
                        }}
                      >
                        {msg.replyTo.sender.username}
                      </span>
                      <span
                        style={{
                          textAlign:
                            msg?.sender?._id === sender?._id ? "left" : "right",
                        }}
                      >
                        {msg.replyTo.fileUrl
                          ? "File"
                          : msg.replyTo.voiceUrl
                            ? "Voice Message"
                            : msg.replyTo.content}
                      </span>
                    </p>
                  )}
                  <p
                    style={{
                      textAlign:
                        msg?.sender?._id === sender?._id ? "right" : "left",
                      margin: "5px 0 0 0",
                      fontFamily: "IranYekan",
                      fontSize: "0.9rem",
                    }}
                    dir="rtl"
                  >
                    {msg?.content}
                  </p>
                  <p
                    className="timestamp"
                    style={{
                      textAlign:
                        msg?.sender?._id === sender?._id ? "left" : "right",
                      margin: "5px 0 0 0",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {msg.isSending || !msg.timestamp ? (
                        <CiClock2 size={10} />
                      ) : msg.timestamp ? (
                        new Date(msg.timestamp).toLocaleTimeString()
                      ) : (
                        "Unknown Time"
                      )}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                      }}
                    >
                      {msg.isPinned && (
                        <span style={{ marginTop: "2px" }}>
                          <GrFormPin size={13} />
                        </span>
                      )}
                      {msg.isEdited && <span><MdOutlineModeEditOutline size={13} /></span>}
                      {msg.isForwarded && <span><RiShareForwardFill size={13} /></span>}
                    </span>
                    
                  </p>
                  <div className="message-options">
                    <button
                      style={{
                        color: "red",
                        width: "20px",
                        position: "absolute",
                        top: "-5px",
                        right:
                          // msg?.sender?._id === sender?._id ? "100%" : "-35px",
                          msg?.sender?._id === sender?._id ? "85%" : "0",
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
                          // top: "35px",
                          top: "15px",
                          right:
                            msg.sender._id === sender?._id ? "100%" : "-83px",
                        }}
                      >
                        <button
                          onClick={() => {
                            toggleOptions(msg._id ?? "");
                            handleReplyMessage(msg);
                            setEditMessage(null);
                            setMessage("");
                          }}
                        >
                          Reply
                        </button>

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
                          {msg.isPinned ? "Unpin" : "Pin"}
                        </button>

                        <button
                          onClick={() => {
                            toggleOptions(msg._id ?? "");
                            handleSaveMessage(msg);
                          }}
                        >
                          Save
                        </button>

                        <button
                          onClick={() => {
                            toggleOptions(msg._id ?? "");
                            handleForwardMessage(msg);
                          }}
                        >
                          Forward
                        </button>

                        {!msg.fileUrl &&
                          !msg.voiceUrl &&
                          sender?._id === msg.sender._id && (
                            <button
                              onClick={() => {
                                toggleOptions(msg._id ?? "");
                                handleEditMessage(msg);
                                setReplyMessage(null);
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
                            onClick={toggleFullScreen}
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
          })}

          {room && (
            <div className="down-icon" onClick={scrollToBottom}>
              <FaChevronDown style={styles.icon} />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <span>
            <IoIosChatbubbles size={70} color="#999" />
          </span>
          <h3 style={{ color: "#999" }}>
            Please Join A Room To Start Chatting !
          </h3>
        </div>
      )}

      {editMessage ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            margin: "5px 0",
            columnGap: "10px",
            marginLeft: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>
              <MdOutlineModeEditOutline style={styles.icon} />
            </span>
            <span>
              Editing <span style={{ fontWeight: "bold" }}>You</span> :{" "}
              {editMessage.content}
            </span>
          </div>
          <div
            onClick={() => setEditMessage(null)}
            style={{ cursor: "pointer", padding: "3px" }}
          >
            <RxCross2 style={styles.icon} />
          </div>
        </div>
      ) : (
        ""
      )}

      {replyMessage ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            margin: "5px 0",
            columnGap: "10px",
            marginLeft: "5px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>
              <FaReply style={styles.icon} />
            </span>
            <span>
              Replying To {replyMessage.sender.username}: {replyMessage.content}
            </span>
          </div>
          <div
            onClick={() => setReplyMessage(null)}
            style={{ cursor: "pointer", padding: "3px" }}
          >
            <RxCross2 style={styles.icon} />
          </div>
        </div>
      ) : (
        ""
      )}

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
        setEditMessage={setEditMessage}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
      />

      <ForwardModal
        offlineUsers={offlineUsers}
        onlineUsers={onlineUsers}
        ModalStyle={ModalStyle}
        openForwardModal={openForwardModal}
        forwardMessageToUser={forwardMessageToUser}
        handleCloseForwardModal={handleCloseForwardModal}
        sender={sender}
        selectedMessageToForward={selectedMessageToForward}
      />

      <JoinRoomModal
        nonParticipantOnlineUsers={nonParticipantOnlineUsers}
        openModal={openModal}
        handleCloseModal={handleCloseModal}
        nonParticipantOfflineUsers={nonParticipantOfflineUsers}
        addUserToRoom={addUserToRoom}
        room={room}
        ModalStyle={ModalStyle}
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
