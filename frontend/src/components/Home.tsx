import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import "./Home.css";
import { IoMdSettings } from "react-icons/io";
import { TbLogout2 } from "react-icons/tb";

interface Message {
  _id?: string;
  sender: Sender;
  recipient: Recipient;
  content: string;
  room: string;
  publicName: string;
  timestamp?: Date;
}

interface Sender {
  _id: string;
  username: string;
  phone: string;
  phoneNumber?: string;
}

interface Recipient {
  _id: string;
  username: string;
  phone: string;
}

const Home: React.FC = () => {
  const [sender, setSender] = useState<Sender | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);

  const [message, setMessage] = useState<string>("");
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
    const roomName = `${sender?._id}-${user.userId}`; // Use userId for unique room

    setRoom(roomName);
    setShownRoomName(
      sender?._id == user.userId
        ? `Saved Messages (${user.username})`
        : user.username
          ? user.username
          : roomName
    );
    socket?.emit("joinRoom", roomName);
  };

  const sendMessage = (e: any) => {
    e.preventDefault();
    if (socket && room) {
      const messageData: Partial<Message> = {
        sender: {
          _id: sender?._id ?? "",
          username: sender?.username ?? "Guest",
          phone: sender?.phoneNumber ?? "N/A",
        },
        content: message,
        room: room,
        publicName: publicName,
      };

      // Only include the recipient if it's a private message (recipient exists)
      if (recipient) {
        messageData.recipient = {
          // @ts-ignore
          _id: recipient.userId,
          username: recipient.username,
          phone: recipient.phone,
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

  // useEffect(() => {
  //   if (room) {
  //     setMessage("");

  //     // @ts-ignore
  //     const formattedRoom = recipient?.userId ? `${sender?._id}-${recipient?.userId}` : publicName;

  //     socket?.emit("getHistory", formattedRoom);

  //     const handleSendHistory = (data: object) => {
  //       setMessages(data as Message[]);
  //     };

  //     socket?.on("sendHistory", handleSendHistory);

  //     return () => {
  //       socket?.off("sendHistory", handleSendHistory);
  //     };
  //   }
  // }, [room, socket, sender?._id, recipient?._id]);

  useEffect(() => {
    if (room) {
      setMessage("");

      // @ts-ignore
      const formattedRoom = recipient?.userId
        ? // @ts-ignore
          `${sender?._id}-${recipient?.userId}`
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
    socket?.on("onlineUsers", (users: any) => {
      setOnlineUsers(users);
    });

    socket?.on("offlineUsers", (users: any) => {
      setOfflineUsers(users);
    });

    return () => {
      socket?.off("onlineUsers");
      socket?.off("offlineUsers");
    };
  }, [socket]);

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
          {onlineUsers?.map((user) => (
            <li
              key={user.userId}
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
                  key={user.userId}
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

        <div className="messages">
          {messages.map((msg: Message) => (
            <div key={msg._id} className="message-container">
              <div
                className={`message ${msg.sender._id === sender?._id ? "sent" : "received"}`}
              >
                <strong>{msg.sender.username}:</strong> {msg.content}
                {/* <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span> */}
                <span className="timestamp">
                  {msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString()
                    : "Unknown time"}
                </span>
                {/* Options dropdown */}
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
            </div>
          ))}
        </div>

        <form className="message-input">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message"
            className="input-field"
          />
          <button
            type="submit"
            onClick={(e) => sendMessage(e)}
            className="send-btn"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;
