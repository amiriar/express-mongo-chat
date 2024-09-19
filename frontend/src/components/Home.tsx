import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import "./Home.css";
import { IoMdSettings } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import { Sender, Recipient, Message, Room } from "../modules/types/types";
import OnlineUsers from "../modules/OnlineUsers";
import OfflineUsers from "../modules/OfflineUsers";
import ChatArea from "../modules/ChatArea";
import checkPageStatus from "../shared/notifications";

const Home: React.FC = () => {
  const [sender, setSender] = useState<Sender | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [message, setMessage] = useState<string>("");
  const [publicName, setPublicName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState<string>("");
  const [shownRoomName, setShownRoomName] = useState<string>("No room joined");
  const [offlineUsers, setOfflineUsers] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/dashboard/whoami`, {
        withCredentials: true,
      })
      .then((res) => {
        setSender(res?.data);
        if (!res?.data.username) navigate("/settings");
        localStorage.setItem("userId", sender?._id ?? "");
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          navigate("/register");
        }
      });
  }, [navigate]);

  useEffect(() => {
    if (!sender) return;

    const socketInstance = io(`${import.meta.env.VITE_BACKEND_BASE_URL}`, {
      query: { userId: sender._id },
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [sender]);

  const createPrivateRoomId = (userId1: string, userId2: string) => {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}-${sortedIds[1]}`;
  };

  const joinRoom = (roomName: string) => {
    setRecipient(null);
    setShownRoomName(roomName);
    setRoom(roomName);
    setPublicName(roomName);

    if (socket) {
      socket.emit("joinRoom", roomName);
    }
  };

  const pvHandler = (user: any) => {
    setShownRoomName("");
    setRecipient(user);

    const roomName = createPrivateRoomId(sender?._id ?? "", user._id);

    setRoom(roomName);

    setShownRoomName(
      sender?._id === user._id
        ? `Saved Messages (${user.username})`
        : user.username
          ? user.username
          : roomName
    );

    socket?.emit("joinRoom", roomName);
  };

  const settingHandler = () => {
    navigate("/settings");
  };

  useEffect(() => {
    if (room) {
      setMessage("");
      const formattedRoom = recipient?._id
        ? `${sender?._id}-${recipient?._id}`
        : publicName;

      socket?.emit("getHistory", formattedRoom);

      socket?.on("sendHistory", (messageData: Message[]) => {
        setMessages(messageData as Message[]);
      });

      socket?.on("deleteMessageResponse", (data: any) => {
        if (data.success) {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => msg._id !== data.messageId)
          );
        } else if (data.success === false) {
          alert("Error in deleting the message");
        }
      });

      return () => {
        socket?.off("deleteMessageResponse");
        socket?.off("sendHistory");
        // socket?.off("voice-message-response");
        socket?.off("newRoomResponse");
        socket?.off("message");
      };
    }
  }, [room, socket, sender?._id, recipient?._id, setMessages]);

  socket?.on("message", (messageData: Message) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((msg) =>
        msg.tempId === messageData.tempId ? messageData : msg
      );

      if (!updatedMessages.some((msg) => msg._id === messageData._id)) {
        updatedMessages.push(messageData);
      }

      if (recipient && sender?._id !== messageData.recipient._id) {
        checkPageStatus(messageData.content, messageData.sender ?? "");
      }
      return updatedMessages;
    });
  });

  socket?.on("newRoomResponse", (roomData: Room[]) => {
    const userRooms = roomData.filter((room) =>
      room.participants.some(
        (participantId) => participantId.toString() === sender?._id
      )
    );

    if (userRooms.length > 0) {
      setRooms(() => [...userRooms]);
    }
  });

  useEffect(() => {
    const handleVoiceMessageResponse = (messageData: any) => {
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(
          (msg) => msg._id === messageData._id
        );
        if (!messageExists) {
          return [...prevMessages, messageData];
        }
        return prevMessages;
      });
    };

    socket?.on("voice-message-response", handleVoiceMessageResponse);

    return () => {
      socket?.off("voice-message-response", handleVoiceMessageResponse);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("onlineUsers", (users: any) => {
      setOnlineUsers(users);
    });

    socket.on("offlineUsers", (users: any) => {
      setOfflineUsers(users);
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("offlineUsers");
    };
  }, [socket]);

  useEffect(() => {
    if (socket) {
      socket.emit("login", sender?._id);

      socket.on("userRooms", (rooms: any[]) => {
        setRooms(rooms);
      });

      return () => {
        socket.off("userRooms");
      };
    }
  }, [socket, sender?._id]);

  const addRoomHandler = () => {
    const roomName = prompt("What is the name of the room?");
    if (roomName?.trim()) {
      if (roomName.length > 15) {
        alert("Use less then 15 charecters");
        return;
      }
      socket?.emit("newRoom", { roomName, senderId: sender?._id });
    } else {
      alert("please write something down...");
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar" style={{ fontFamily: "Poppins" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Chat Rooms</h2>
          <div
            onClick={settingHandler}
            style={{ cursor: "pointer", boxSizing: "border-box" }}
          >
            <IoMdSettings size={30} />
          </div>
        </div>

        {rooms.map((room: any) => {
          return (
            <button
              key={room?._id}
              onClick={() => joinRoom(room)}
              className="room-btn"
            >
              {room.roomName}
            </button>
          );
        })}

        <button onClick={addRoomHandler} className="add-room-btn">
          <FaPlus />
          Add a Room
        </button>

        <div>
          <h2 style={{ marginTop: "20px" }}>Users</h2>

          {/* Online Users */}
          {/* <ul className="users-list">
            {onlineUsers?.map((user: any) => (
              <li
                key={user._id}
                onClick={() => pvHandler(user)}
                style={{ cursor: "pointer", padding: "2px" }}
              >
                <img
                  src={
                    user._id === sender?._id
                      ? `${import.meta.env.VITE_BACKEND_BASE_URL}/public/static/savedMessages/saved-messages.jpg`
                      : `${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`
                  }
                  alt="Profile"
                  className="avatar"
                />

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span>
                    {user._id === sender?._id ? (
                      "Saved Messages"
                    ) : (
                      <span>{user.username}</span>
                    )}
                  </span>
                  <span>(Online)</span>
                </div>
              </li>
            ))}
          </ul> */}
          <OnlineUsers
            onlineUsers={onlineUsers}
            pvHandler={pvHandler}
            sender={sender}
          />

          {/* Offline Users */}
          {/* <div
            className="offline-users"
            style={{ marginTop: "15px", marginBottom: "20px" }}
          >
            <h3 style={{ marginBottom: "15px" }}>Offline Users</h3>
            <ul className="users-list">
              {offlineUsers.map((user: any) => (
                <li
                  key={user._id}
                  onClick={() => pvHandler(user)}
                  style={{ cursor: "pointer", padding: "2px" }}
                >
                  <img
                    src={`${import.meta.env.VITE_BACKEND_BASE_URL}/${user.profile}`}
                    alt="Profile"
                    className="avatar"
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span>{user.username}</span>
                    <span>
                      {user.lastSeen
                        ? ` ${new Date(user.lastSeen).toLocaleString()}`
                        : " (Offline)"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div> */}
          <OfflineUsers offlineUsers={offlineUsers} pvHandler={pvHandler} />
        </div>
      </div>

      {/* <div className="chat-area">
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
      </div> */}

      <ChatArea
        message={message}
        setMessage={setMessage}
        messages={messages}
        shownRoomName={shownRoomName}
        room={room}
        recipient={recipient}
        sender={sender}
        socket={socket}
        onlineUsers={onlineUsers}
        offlineUsers={offlineUsers}
        publicName={publicName}
      />
    </div>
  );
};

export default Home;
