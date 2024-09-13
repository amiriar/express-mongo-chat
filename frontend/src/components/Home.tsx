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

interface Message {
  _id?: string;
  sender: Sender;
  recipient: Recipient;
  content: string;
  room: string;
  publicName: string;
  timestamp?: Date;
  voiceUrl?: string;
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
  const [rooms, setRooms] = useState<Array<string>>([
    "Public Room 1",
    "Public Room 2",
  ]);
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
      .get("http://localhost:3001/api/dashboard/whoami", {
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

    const socketInstance = io("http://localhost:3001", {
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

  const sendMessage = (e: any) => {
    e.preventDefault();
    if (!message.trim()) return alert("Please write something down.");

    if (socket && room) {
      const messageData: Partial<Message> = {
        sender: {
          _id: sender?._id ?? "",
        },
        content: message,
        room: room,
        publicName: publicName,
      };

      // Only include the recipient if it's a private message (recipient exists)
      if (recipient) {
        messageData.recipient = {
          _id: recipient._id,
        };
      }

      socket.emit("sendMessage", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData as Message]);
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

  useEffect(() => {
    if (room) {
      setMessage("");

      const formattedRoom = recipient?._id
        ? `${sender?._id}-${recipient?._id}`
        : publicName;

      // Function to get message history
      const getHistory = () => {
        socket?.emit("getHistory", formattedRoom);

        const handleSendHistory = (data: object) => {
          setMessages(data as Message[]);
        };

        socket?.on("sendHistory", handleSendHistory);

        // Clean up: Remove the listener for "sendHistory" to avoid duplicate listeners
        return () => {
          socket?.off("sendHistory", handleSendHistory);
        };
      };

      // Call getHistory immediately and set up an interval
      getHistory();
      const interval = setInterval(getHistory, 1000);

      // Clean up: clear the interval when the component unmounts or room changes
      return () => clearInterval(interval);
    }
  }, [room, socket, sender?._id, recipient?._id, publicName]);

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
      socket.off("voice-message"); // Clean up listener when component unmounts
    };
  }, [socket]);

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
        console.log(recipient);

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

          console.log("Server response:", response);

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
      await axios.delete(`http://localhost:3001/api/messages/${messageId}`);
      console.log(`Message with ID ${messageId} deleted.`);
      // Refresh messages or remove the deleted message from the state
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    console.log("Message copied to clipboard:", message);
  };

  const toggleOptions = (messageId: string) => {
    setSelectedMessageId(selectedMessageId === messageId ? null : messageId);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change or component mounts
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Chat Rooms</h2>

        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => joinRoom(room)}
            className="room-btn"
          >
            Join {room}
          </button>
        ))}

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
          {/* <h2>Chat Room: {room || shownRoomName || "No room joined"}</h2> */}
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

        {/* <div className="messages">
          {messages.map((msg: Message) => (
            <div key={msg._id} className="message-container">
              <div
                className={`message ${msg.sender._id === sender?._id ? "sent" : "received"}`}
              >
                <strong>{msg.sender.username}:</strong> {msg.content}
                <span className="timestamp">
                  {msg.timestamp ? (
                    new Date(msg.timestamp).toLocaleTimeString()
                  ) : (
                    <CiClock2 size={10} />
                  )}
                </span>
                <div className="message-options">
                  <button
                    style={{
                      color: "red",
                      width: "20px",
                      position: "absolute",
                      top: "-5px",
                      right: msg.sender._id === sender?._id ? "100%" : "-35px",
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
                      <button onClick={() => handleCopyMessage(msg.content)}>
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
          ))}
        </div> */}

        {/* <div className="messages">
          {room ? (
            messages.map((msg: Message) => (
              <div key={msg._id} className="message-container">
                <div
                  className={`message ${
                    msg.sender._id === sender?._id ? "sent" : "received"
                  }`}
                >
                  <strong>{msg.sender.username}:</strong> {msg.content}
                  <span className="timestamp">
                    {msg.timestamp ? (
                      new Date(msg.timestamp).toLocaleTimeString()
                    ) : (
                      <CiClock2 size={10} />
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
                        <button onClick={() => handleCopyMessage(msg.content)}>
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
            ))
          ) : (
            <div className="no-room-message" style={styles.noRoomMessage}>
              <FaComments size={40} style={{ marginBottom: "10px" }} />
              <p style={{ fontSize: "18px" }}>Join a room to start chatting!</p>
            </div>
          )}
        </div>

        <form
          className="message-input"
          onSubmit={sendMessage}
          style={styles.form}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="input-field"
            style={styles.inputField}
            disabled={room ? false : true}
          />
          <div
            className="voice-message-controls"
            style={styles.voiceMessageControls}
          >
            {isRecording ? (
              <FaStop onClick={handleStopRecording} style={styles.icon} />
            ) : (
              <FaMicrophone
                onClick={handleStartRecording}
                style={styles.icon}
              />
            )}
          </div>
          <button type="submit" className="send-btn" style={styles.sendBtn}>
            <FaPaperPlane />
          </button>
        </form> */}

        <div className="messages">
          {room ? (
            messages.map((msg: Message) => (
              <div key={msg._id} className="message-container">
                <div
                  className={`message ${
                    msg.sender._id === sender?._id ? "sent" : "received"
                  }`}
                >
                  <strong>{msg.sender.username}:</strong> {msg.content}
                  <span className="timestamp">
                    {msg.timestamp ? (
                      new Date(msg.timestamp).toLocaleTimeString()
                    ) : (
                      <CiClock2 size={10} />
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
                        <button onClick={() => handleCopyMessage(msg.content)}>
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
            ))
          ) : (
            <div className="no-room-message" style={styles.noRoomMessage}>
              <FaComments size={40} style={{ marginBottom: "10px" }} />
              <p style={{ fontSize: "18px" }}>Join a room to start chatting!</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message input and controls */}
        {/* <form
          className="message-input"
          onSubmit={sendMessage}
          style={styles.form}
        >
          <input
            value={room ? "" : "Join a room to send a message!"}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="input-field"
            style={styles.inputField}
            disabled={!room} // Disable input if no room is joined
          />
          <div
            className="voice-message-controls"
            style={styles.voiceMessageControls}
          >
            {isRecording ? (
              <FaMicrophone onClick={handleStopRecording} style={styles.icon} />
            ) : (
              <FaMicrophone
                onClick={handleStartRecording}
                style={styles.icon}
              />
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
        </form> */}

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
                  display: room ? "flex" : "none"
                }}
                onClick={handleStartRecording}
              >
                <FaMicrophone
                  style={styles.icon}
                />
              </div>
            ) : (
              <div
                style={{
                  boxSizing: "border-box",
                  padding: "5px",
                  cursor: "pointer",
                  display: room ? "flex" : "none"
                }}
                onClick={handleStopRecording}
              >
                <FaStop
                  style={styles.icon}
                />
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
