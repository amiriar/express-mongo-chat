import axios from "axios";
import React, { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import "./Home.css";
import { IoMdSettings } from "react-icons/io";

interface Message {
  sender: Sender; =
  recipient: Recipient;
  content: string;
  room: string;
}

interface Sender {
  _id: string;
  username: string;
  phone: string;
  firstname: string;
  lastname: string;
  profile: string;
  email: string;
}

interface Recipient {
  _id: string;
  username: string;
  profile: string;
  phone: string;
}

const Home: React.FC = () => {
  const [sender, setSender] = useState<Sender | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<
    Array<{ username: string; profile: string; userId: string }>
  >([]);
  const [lastSeen, setLastSeen] = useState<Record<string, Date>>({});
  const [rooms, setRooms] = useState<Array<string>>([
    "Public Room 1",
    "Public Room 2",
  ]);
  const [room, setRoom] = useState<string>("");
  const [shownRoomName, setShownRoomName] = useState<string>("");

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
    // Initialize WebSocket connection once
    const socketInstance = io("http://localhost:3001", {
      query: { userId: sender?._id },
    });
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    // Clean up WebSocket connection when component unmounts
    return () => {
      socketInstance.disconnect();
    };
  }, [sender]);

  const joinRoom = (roomName: string) => {
    socket && socket.emit("joinRoom", roomName);
    setRoom(roomName);
  };

  const pvHandler = (user: any) => {
    setShownRoomName("");
    setRecipient(user);
    const roomName = `${user.id}-${user.userId}`; // Use userId for unique room
    setRoom(roomName);
    setShownRoomName(
      sender?.id == user.userId
        ? `Saved Messages (${user.username})`
        : user.username
          ? user.username
          : roomName
    );
    socket?.emit("joinRoom", roomName);
  };

  const sendMessage = () => {
    if (socket && recipient && room) {
      const messageData: Message = {
        sender: {
          _id: sender?._id,
          username: sender?.username,
          profile: sender?.profile,
          phone: sender?.phone,
        },
        recipient: {
          _id: recipient._id,
          username: recipient.username,
          profile: recipient.profile,
          phone: recipient.phone,
        },
        content: message,
        room: room,
      };

      // Emit the message to the server
      console.log("Sending message:", messageData);
      socket.emit("sendMessage", messageData);

      // Update messages locally
      setMessages((prevMessages) => [...prevMessages, messageData]);

      // Clear the input
      setMessage("");
    } else {
      alert("Please choose someone to send the message to.");
    }
  };

  const settingHandler = () => {
    navigate("/setting");
  };

  useEffect(() => {
    if (room && socket) {
      setMessage("");

      const handleSendHistory = (data: object) => {
        console.log("Received history:", data);
        setMessages(data as Message[]); // Assuming `data` is the chat history
      };

      // Listen for chat history from the server
      socket.on("sendHistory", handleSendHistory);

      // Request chat history when a new room is joined
      socket.emit("getHistory", room);

      // Clean up to prevent multiple listeners
      return () => {
        socket.off("sendHistory", handleSendHistory);
      };
    }
  }, [room, socket]);

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Chat Rooms</h2>

        {rooms.map((room) => (
          <button onClick={() => joinRoom(room)} className="room-btn">
            Join {room}
          </button>
        ))}

        <h2 style={{ marginTop: "20px" }}>Users</h2>
        <ul className="users-list">
          {onlineUsers.map((user) => (
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
            style={{ padding: "5px", cursor: "pointer" }}
            onClick={settingHandler}
          >
            <IoMdSettings size={30} />
          </div>
        </div>
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <strong>{msg?.sender?.username}:</strong> {msg.content}
            </div>
          ))}
        </div>

        <div className="message-input">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message"
            className="input-field"
          />
          <button onClick={sendMessage} className="send-btn">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
