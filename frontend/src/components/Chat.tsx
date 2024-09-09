import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

const socket: typeof Socket = io('http://localhost:3001', {
  transports: ['websocket'], // Ensure WebSocket transport is used
});

interface Message {
  sender: string;
  recipient: string;
  content: string;
}

const Chat: React.FC = () => {
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<
    Array<{ sender: string; recipient: string; content: string }>
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:3001/api/dashboard/whoami', {
        withCredentials: true,
      })
      .then((res) => {
        console.log(res);
        // @ts-ignore
        setUserId(res.response.data.id);
      })
      .catch((err) => {
        if (err?.response?.status) navigate('/');
      });

    // Log when connected
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    // Listen for new messages from the server
    socket.on('message', (newMessage: any) => {
      console.log('Received message:', newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Clean up on component unmount
    return () => {
      socket.off('message');
      socket.off('connect');
    };
  }, []);

  const sendMessage = () => {
    const messageData = {
      sender: userId,
      recipient: 'userId2', // Replace with actual recipient ID
      content: message,
    };

    console.log('Sending message:', messageData);
    // Emit the message to the server
    socket.emit('sendMessage', messageData);

    // Clear the input
    setMessage('');
  };

  return (
    <div>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{`${msg.sender}: ${msg.content}`}</li>
        ))}
      </ul>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
