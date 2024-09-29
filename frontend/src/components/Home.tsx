import axios from "axios";
import React, { useEffect, useState } from "react";
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
  const [pinMessage, setPinMessage] = useState<Message | null>(null);
  const [message, setMessage] = useState<string>("");
  const [publicName, setPublicName] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState<string>("");
  const [shownRoomName, setShownRoomName] = useState<string>("No room joined");
  const [offlineUsers, setOfflineUsers] = useState([]);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

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

  const joinRoom = (roomName: any) => {
    setRecipient(null);
    setShownRoomName(roomName);
    setRoom(roomName);
    setPublicName(roomName);

    if (socket) {
      socket.emit("joinRoom", roomName._id ? roomName._id : roomName);
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

      socket?.on(
        "deleteMessageResponse",
        ({ success, messageId, error, deletedBy, deletedByEveryone }: any) => {
          if (success) {
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => {
                const isCurrentMessage = msg._id === messageId;
                const isDeletedForEveryone = deletedByEveryone;
                const isDeletedForSender =
                  deletedBy && deletedBy.includes(sender?._id);

                if (isDeletedForEveryone && isCurrentMessage) {
                  return false;
                }

                return !isCurrentMessage || !isDeletedForSender;
              })
            );
          } else {
            console.error("Failed to delete message:", error);
          }
        }
      );

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

    socket?.on("fileUpload-respond", (messageData: Message) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    socket?.on("editMessageResponse", (messageData: Message) => {
      setEditMessage(null);

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageData._id ? messageData : msg
        )
      );
    });

    socket?.on("voice-message-response", handleVoiceMessageResponse);

    return () => {
      socket?.off("voice-message-response", handleVoiceMessageResponse);
      socket?.off("fileUpload-respond");
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
          <h2 style={{ marginTop: "20px", fontSize: "1.2rem" }}>
            Online Users
          </h2>

          <OnlineUsers
            onlineUsers={onlineUsers}
            pvHandler={pvHandler}
            sender={sender}
          />

          <OfflineUsers offlineUsers={offlineUsers} pvHandler={pvHandler} />
        </div>
      </div>

      <ChatArea
        message={message}
        setMessage={setMessage}
        setMessages={setMessages}
        messages={messages}
        shownRoomName={shownRoomName}
        setShownRoomName={setShownRoomName}
        room={room}
        recipient={recipient}
        sender={sender}
        socket={socket}
        onlineUsers={onlineUsers}
        setOnlineUsers={setOnlineUsers}
        offlineUsers={offlineUsers}
        setOfflineUsers={setOfflineUsers}
        publicName={publicName}
        setRooms={setRooms}
        setRoom={setRoom}
        pinMessage={pinMessage}
        setPinMessage={setPinMessage}
        editMessage={editMessage}
        setEditMessage={setEditMessage}
        replyMessage={replyMessage}
        setReplyMessage={setReplyMessage}
      />
    </div>
  );
};

export default Home;
