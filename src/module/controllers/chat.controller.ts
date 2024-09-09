import { Request, Response, NextFunction } from 'express';
import ChatMessageModel from '../models/chatMessage.model';

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sender, recipient, content } = req.body;

    const newMessage = new ChatMessageModel({
      sender,
      recipient,
      content,
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    next(error);
  }
};

// Get chat messages between two users or in a room
export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sender, recipient } = req.query;  // IDs of the two users or room

    const messages = await ChatMessageModel.find({
      $or: [
        { sender, recipient },
        { sender: recipient, recipient: sender }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};
