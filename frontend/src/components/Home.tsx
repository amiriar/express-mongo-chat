import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import "./Home.css";
import { IoMdSettings } from "react-icons/io";
import { TbLogout2 } from "react-icons/tb";
import { CiClock2 } from "react-icons/ci";
import { FaMicrophone, FaStop, FaPaperPlane } from "react-icons/fa";
import { FaComments } from "react-icons/fa";
import mongoose from "mongoose";

interface Message {
  _id?: string;
  tempId: string;
  sender: Sender;
  recipient: Recipient;
  content: string;
  room: string;
  publicName: string;
  timestamp?: Date | null;
  voiceUrl?: string;
  isSending: boolean;
}

interface Sender {
  _id: string;
  username?: string;
  phone?: string;
  profile?: string;
}

interface Recipient {
  _id: string;
  username?: string;
  phone?: string;
  profile?: string;
}

const Home: React.FC = () => {
  const [sender, setSender] = useState<Sender | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  const [message, setMessage] = useState<string>(""); // message input
  const [publicName, setPublicName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<
    Array<{ username: string; profile: string; userId: string }>
  >([]);
  // const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [lastSeen, setLastSeen] = useState<Record<string, Date>>({});
  const [rooms, setRooms] = useState<Array<string>>([]);
  const [room, setRoom] = useState<string>("");
  const [shownRoomName, setShownRoomName] = useState<string>("");
  const [offlineUsers, setOfflineUsers] = useState([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user ID when component mounts
    axios
      .get(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/dashboard/whoami`, {
        withCredentials: true,
      })
      .then((res) => {
        setSender(res?.data);
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
  }, [sender]); // Ensure it only runs when `sender` is set

  const joinRoom = (roomName: string) => {
    setRecipient(null); // Clear recipient for public rooms
    setShownRoomName(roomName); // Display the room name
    setRoom(roomName);
    setPublicName(roomName);

    if (socket) {
      socket.emit("joinRoom", roomName); // Emit join room event
    }
  };

  const pvHandler = (user: any) => {
    setShownRoomName("");
    setRecipient(user);
    const roomName = `${sender?._id}-${user._id}`;

    setRoom(roomName);

    setShownRoomName(
      sender?._id == user._id
        ? `Saved Messages (${user.username})`
        : user.username
          ? user.username
          : roomName
    );
    socket?.emit("joinRoom", roomName);
  };

  // const sendMessage = (e: any) => {
  //   e.preventDefault();
  //   if (!message.trim()) return alert("Please write something down.");

  //   if (socket && room) {
  //     const tempId = new Date().getTime(); // Temporary ID for tracking the message
  //     const messageData: Partial<Message> = {
  //       // @ts-ignore
  //       _id: tempId, // Temporary ID for the message
  //       sender: {
  //         _id: sender?._id ?? "",
  //       },
  //       content: message,
  //       room: room,
  //       publicName: publicName,
  //       // @ts-ignore
  //       timestamp: null, // Placeholder timestamp
  //       isSending: true, // Flag to show sending status
  //     };

  //     // Add the message with a "sending" flag
  //     setMessages((prevMessages) => [...prevMessages, messageData as Message]);
  //     setMessage("");

  //     socket.emit("sendMessage", messageData);
  //   } else {
  //     alert("Please select a room or user to send the message.");
  //   }
  // };

  const sendMessage = (e: any) => {
    e.preventDefault();
    if (!message.trim()) return alert("Please write something down.");

    if (socket && room) {
      const tempId = uuidv4(); // Temporary ID for tracking the message
      const messageData: Partial<Message> = {
        tempId, // Assign tempId here
        sender: {
          _id: sender?._id ?? "",
          username: sender?.username ?? "unknown",
        },
        content: message,
        room: room,
        publicName: publicName,
        isSending: true, // Mark as sending
      };

      if (recipient) {
        messageData.recipient = {
          _id: recipient._id,
        };
      }

      // Add the message to the state with 'isSending' status
      setMessages((prevMessages) => [...prevMessages, messageData as Message]);

      // Emit the message to the server
      socket.emit("sendMessage", messageData);

      setMessage("");
    } else {
      alert("Please select a room or user to send the message.");
    }
  };

  const settingHandler = () => {
    navigate("/setting");
  };

  const logoutHandler = () => {
    axios
      .get("http://localhost:3001/api/auth/logout", {
        withCredentials: true,
      })
      .then(() => {
        navigate("/");
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          navigate("/register");
        }
      });
  };

  // useEffect(() => {
  //   if (room) {
  //     setMessage("");

  //     const formattedRoom = recipient?._id
  //       ? `${sender?._id}-${recipient?._id}`
  //       : publicName;

  //     // Function to get message history
  //     const getHistory = () => {
  //       socket?.emit("getHistory", formattedRoom);
  //       console.log('req');

  //       // const handleSendHistory = (data: object) => {
  //       //   console.log(data);
  //       //   setMessages(data as Message[]);
  //       // };

  //       socket?.on("sendHistory", (messageData: Message[]) => {
  //         setMessages(messageData as Message[]);
  //       });

  //       // Clean up: Remove the listener for "sendHistory" to avoid duplicate listeners
  //       return () => {
  //         // socket?.off("sendHistory", handleSendHistory);
  //         socket?.on("sendHistory", (messageData: Message[]) => {
  //           setMessages(messageData as Message[]);
  //         });
  //       };
  //     };

  //     // Call getHistory immediately and set up an interval
  //     getHistory();
  //     // const interval = setInterval(getHistory, 1000);

  //     // // Clean up: clear the interval when the component unmounts or room changes
  //     // return () => clearInterval(interval);
  //   }
  // }, [room, socket, sender?._id, recipient?._id]);

  useEffect(() => {
    if (room) {
      setMessage("");
      const formattedRoom = recipient?._id
        ? `${sender?._id}-${recipient?._id}`
        : publicName;

      // Function to get message history
      socket?.emit("getHistory", formattedRoom);

      socket?.on("sendHistory", (messageData: Message[]) => {
        setMessages(messageData as Message[]);
      });

      // Get message history when the component mounts or room changes

      // Listen for new incoming messages in real-time
      // const handleIncomingMessage = (newMessage: Message) => {
      //   setMessages((prevMessages) => [...prevMessages, newMessage]); // Add new message to the list
      // };

      // socket?.on("message", handleIncomingMessage); // Listen for 'message' event from backend

      // Clean up the event listeners when the component unmounts or room changes
      return () => {
        socket?.off("sendHistory");
        // socket?.off("message", handleIncomingMessage);
      };
    }
  }, [room, socket, sender?._id, recipient?._id, setMessages]);

  socket?.on("message", (messageData: Message) => {
    setMessages((prevMessages) => {
      // Check if the message was a "sending" message by matching tempId
      const updatedMessages = prevMessages.map((msg) =>
        msg.tempId === messageData.tempId ? messageData : msg
      );

      // If the message is new, add it to the message list
      if (!updatedMessages.some((msg) => msg._id === messageData._id)) {
        updatedMessages.push(messageData);
      }

      return updatedMessages;
    });
  });

  useEffect(() => {
    if (!socket) return;

    socket.on("onlineUsers", (users: any) => {
      setOnlineUsers(users);
    });

    socket.on("offlineUsers", (users: any) => {
      setOfflineUsers(users);
    });

    // socket?.on("message", (messageData: Message) => {
    // setMessages((prevMessages) => {
    // Check if the message was a "sending" message by matching tempId
    // const updatedMessages = prevMessages.map((msg) =>
    //   msg.tempId === messageData.tempId ? messageData : msg
    // );

    // // If the message is new, add it to the message list
    // if (!updatedMessages.some((msg) => msg._id === messageData._id)) {
    //   updatedMessages.push(messageData);
    // }

    // return updatedMessages;
    // });
    // setMessages((prevMessages) => [...prevMessages, messageData]);
    // });
    socket.on("message", (receivedMessage: Message) => {
      console.log("newmesg: ", receivedMessage);

      // setMessages((prevMessages) =>
      //   prevMessages.map((msg) =>
      //     msg.tempId === receivedMessage.tempId
      //       ? { ...msg, ...receivedMessage, isSending: false } // Update the message
      //       : msg
      //   )
      // );
      setMessages((oldData: Message[]) => {
        return [...oldData, receivedMessage];
      });
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("offlineUsers");
      socket.off("voice-message"); // Clean up listener when component unmounts
      socket?.off("message");
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

  const recordedChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = () => {
    setIsRecording(true);
    recordedChunksRef.current = []; // Clear previous chunks

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
            `http://localhost:3001/api/messages/upload-voice`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            }
          );

          const mp3Url = response.data.filePath;
          socket?.emit("voice-message", { mp3Url, room });
        } catch (error) {
          console.error("Error uploading voice message:", error);
        }
      };
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/messages/${messageId}`
      );
      console.log(`Message with ID ${messageId} deleted.`);
      // Refresh messages or remove the deleted message from the state
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
  };

  const toggleOptions = (messageId: string) => {
    setSelectedMessageId(selectedMessageId === messageId ? null : messageId);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Chat Rooms</h2>

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

        <h2 style={{ marginTop: "20px" }}>Users</h2>
        <ul className="users-list">
          {onlineUsers?.map((user: any) => (
            <li
              key={user._id}
              onClick={() => pvHandler(user)}
              style={{ cursor: "pointer", padding: "2px" }}
            >
              <img
                src={`http://localhost:3001/${user.profile}`}
                alt="Profile"
                className="avatar"
              />
              <span>{user.username} (Online)</span>
            </li>
          ))}

          <div className="offline-users">
            <h3>Offline Users</h3>
            <ul className="users-list">
              {offlineUsers.map((user: any) => (
                <li
                  key={user._id}
                  onClick={() => pvHandler(user)}
                  style={{ cursor: "pointer", padding: "2px" }}
                >
                  <img
                    src={`http://localhost:3001/${user.profile}`}
                    alt="Profile"
                    className="avatar"
                  />
                  <span>{user.username} (Offline)</span>
                </li>
              ))}
            </ul>
          </div>

          {Object.entries(lastSeen).map(([userId, timestamp]) => (
            <li key={userId}>
              {userId} (Last seen: {new Date(timestamp).toLocaleString()})
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-area">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>
            Chat Room:{" "}
            {shownRoomName ? shownRoomName : room ? room : "No room joined"}
          </h2>
          <div
            style={{
              padding: "5px",
              cursor: "pointer",
              display: "flex",
              gap: "15px",
            }}
          >
            <div onClick={logoutHandler}>
              <TbLogout2 size={30} />
            </div>
            <div onClick={settingHandler}>
              <IoMdSettings size={30} />
            </div>
          </div>
        </div>

        <div className="messages">
          {room ? (
            messages.map((msg: Message) => {
              return (
                <div
                  // key={msg._id ? msg._id : Math.random() * 10000}
                  key={msg._id || msg.tempId}
                  className="message-container"
                >
                  <div
                    className={`message ${
                      msg.sender._id === sender?._id ? "sent" : "received"
                    }`}
                  >
                    <strong>{msg.sender.username}:</strong> {msg.content}
                    {/* <span className="timestamp">
                      {msg.timestamp ? (
                        new Date(msg.timestamp).toLocaleTimeString()
                      ) : (
                        <CiClock2 size={10} />
                      )}
                    </span> */}
                    <span className="timestamp">
                      {msg.isSending ? (
                        <CiClock2 size={10} /> // Sending icon
                      ) : msg.timestamp ? (
                        new Date(msg.timestamp).toLocaleTimeString() // Actual timestamp
                      ) : (
                        "Unknown Time" // Fallback or placeholder
                      )}
                    </span>
                    <div className="message-options">
                      <button
                        style={{
                          color: "red",
                          width: "20px",
                          position: "absolute",
                          top: "-5px",
                          right:
                            msg.sender._id === sender?._id ? "100%" : "-35px",
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
                            onClick={() => handleCopyMessage(msg.content)}
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg._id ?? "")}
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
                          msg.sender._id === sender?._id ? "right" : "left",
                      }}
                    >
                      <audio className="audio-player" controls>
                        <source
                          src={`http://localhost:3001/${msg.voiceUrl}`}
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
            value={room ? message : ""} // Only allow input if room is joined
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              room ? "Type your message..." : "Join a room to send a message!"
            }
            className="input-field"
            style={styles.inputField}
            disabled={!room} // Disable input if no room is joined
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
            disabled={!room} // Disable button if no room is joined
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

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
    flex: 8, // 80% of the input area
    padding: "10px",
    border: "none",
    borderRadius: "5px",
    marginRight: "10px",
    fontSize: "16px",
  },
  voiceMessageControls: {
    flex: 1, // 10% of the input area
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginRight: "10px",
  },
  sendBtn: {
    flex: 1, // 10% of the input area
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

export default Home;
