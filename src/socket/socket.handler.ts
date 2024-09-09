import { Server, Socket } from 'socket.io';

export const handleSocketConnections = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`New user connected: ${socket.id}`);

    // Handle chat message
    socket.on('chatMessage', (message) => {
      // Broadcast to everyone including the sender
      io.emit('chatMessage', message);
    });

    // Handle user typing event
    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('typing', isTyping);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
