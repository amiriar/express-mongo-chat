import mongoose from 'mongoose';
import ChatMessageModel from '../module/models/chatMessage.model';
import UserModel from '../module/models/user.model';
import { Server, Socket } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const handleSocketConnections = (io: Server) => {
  const onlineUsers = new Map();
  io.on('connection', (socket: Socket) => {
    console.log(`New user connected: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    onlineUsers.set(userId, socket.id);

    UserModel.findById(userId).then(async (user) => {
      if (user) {
        const userData = await UserModel.findOne(
          { _id: user?._id },
          { username: 1, phoneNumber: 1, id: 1, profile: 1 },
        );

        onlineUsers.set(userId, userData);

        io.emit('onlineUsers', Array.from(onlineUsers.values()));

        sendOfflineUsers(socket);
      }
    });

    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('typing', isTyping);
    });

    socket.on('disconnect', async () => {
      const userId = socket.handshake.query.userId;
      const lastSeen = new Date();

      await UserModel.updateOne({ _id: userId }, { lastSeen });

      onlineUsers.delete(userId);
      io.emit('onlineUsers', Array.from(onlineUsers.values()));

      sendOfflineUsers(socket);
    });

    socket.on('messageSeen', async (messageId) => {
      await ChatMessageModel.updateOne({ _id: messageId }, { seen: true });
    });

    socket.on('joinRoom', (roomName) => {
      socket.join(roomName);
    });

    socket.on('leaveRoom', (roomName) => {
      socket.leave(roomName);
    });

    socket.on('getHistory', async (roomName) => {
      try {
        const ids = roomName.split('-');
        const isPrivateChat =
          ids.length === 2 &&
          ids.every((id: string) => mongoose.Types.ObjectId.isValid(id));

        let history = [];

        if (isPrivateChat) {
          const [senderId, recipientId] = ids;

          const senderObjectId = new mongoose.Types.ObjectId(senderId);
          const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

          history = await ChatMessageModel.find({
            $or: [
              {
                sender: senderObjectId,
                recipient: recipientObjectId,
              },
              {
                sender: recipientObjectId,
                recipient: senderObjectId,
              },
            ],
          })
            .populate('sender', 'username profile phoneNumber')
            .populate('recipient', 'username profile phoneNumber')
            .sort({ timestamp: 1 });
        } else {
          history = await ChatMessageModel.find({
            room: roomName,
          })
            .populate('sender', 'username profile phoneNumber')
            .populate('recipient', 'username profile phoneNumber')
            .sort({ timestamp: 1 });
        }
        socket.emit('sendHistory', history);
      } catch (error) {
        console.error('Error fetching chat history:', error);
        socket.emit('sendHistory', []);
      }
    });

    socket.on('sendMessage', async (messageData) => {
      try {
        const newMessage = await ChatMessageModel.create(messageData);

        const sender = await UserModel.findById(
          newMessage.sender,
          'username profile',
        );
        const recipient = await UserModel.findById(
          newMessage.recipient,
          'username profile',
        );

        const messageToSend = {
          _id: newMessage._id,
          content: newMessage.content,
          room: newMessage.room,
          timestamp: newMessage.timestamp,
          status: newMessage.status,
          voiceUrl: newMessage.voiceUrl,
          sender: {
            _id: sender?._id,
            username: sender?.username,
            profile: sender?.profile,
          },
          recipient: recipient
            ? {
                _id: recipient._id,
                username: recipient.username,
                profile: recipient.profile,
              }
            : null,
        };

        io.to(messageToSend.room).emit('message', messageToSend);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    const sendOfflineUsers = async (socket: Socket) => {
      const allUsers = await UserModel.find({}, '_id username profile');

      const offlineUsers = allUsers.filter(
        (user: any) => !onlineUsers.has(user._id.toString()),
      );

      socket.emit('offlineUsers', offlineUsers);
    };

    socket.on(
      'voice-message',
      async (audioArrayBuffer: ArrayBuffer, messageData) => {
        try {
          const audioBuffer = Buffer.from(audioArrayBuffer);
          const fileName = `audio_${uuidv4()}.mp3`;
          const audioUploadPath = path.join(
            __dirname,
            '..',
            '..',
            'public',
            'uploads',
            'audio',
          );

          if (!fs.existsSync(audioUploadPath)) {
            fs.mkdirSync(audioUploadPath, { recursive: true });
          }

          fs.writeFileSync(`${audioUploadPath}/${fileName}`, audioBuffer);

          const voiceUrl = `/uploads/audio/${fileName}`;

          messageData.voiceUrl = voiceUrl;
          const newMessage = await ChatMessageModel.create(messageData);

          const sender = await UserModel.findById(
            newMessage.sender,
            'username profile',
          );
          const recipient = await UserModel.findById(
            newMessage.recipient,
            'username profile',
          );

          const messageToSend = {
            ...newMessage.toObject(),
            sender: {
              _id: sender?._id,
              username: sender?.username,
              profile: sender?.profile,
            },
            recipient: recipient
              ? {
                  _id: recipient._id,
                  username: recipient.username,
                  profile: recipient.profile,
                }
              : null,
          };

          io.to(messageData.room).emit('voice-message', messageToSend);
        } catch (error) {
          console.error('Error saving voice message:', error);
        }
      },
    );
  });
};
