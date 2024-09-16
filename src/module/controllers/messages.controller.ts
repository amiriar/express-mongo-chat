import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import autoBind from "auto-bind";
import UserModel from "../models/user.model"; // Assuming UserModel is required for something else later
import ffmpegStatic from "ffmpeg-static"; // Add this line
import ChatMessageModel from "../../module/models/chatMessage.model";
import { v4 as uuidv4 } from "uuid";
import messagesService from "../services/messages.service";

if (!ffmpegStatic) {
  throw new Error("FFmpeg binary not found. Please install ffmpeg-static.");
}

ffmpeg.setFfmpegPath(ffmpegStatic);

export class MessagesController {
  #messageModel: typeof ChatMessageModel;
  #service: typeof messagesService;

  constructor() {
    autoBind(this);
    this.#messageModel = ChatMessageModel;
    this.#service = messagesService;
  }
  uploadVoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const webmFilePath = req.file.path;
      const mp3FilePath = path.join(
        "public",
        "uploads",
        "voiceMessage",
        `${uuidv4()}.mp3`
      );

      ffmpeg(webmFilePath)
        .toFormat("mp3")
        .on("end", async () => {
          fs.unlinkSync(webmFilePath);

          const { sender, recipient, room } = req.body;

          const senderParsed = JSON.parse(sender);
          const recipientParsed = recipient ? JSON.parse(recipient) : null;
          const roomParsed = JSON.parse(room);

          if (!senderParsed   || !roomParsed) {
            return res.status(400).json({ message: "Missing required fields" });
          }

          await this.#service.uploadVoice(
            mp3FilePath,
            senderParsed,
            recipientParsed,
            roomParsed
          );

          res.json({ filePath: mp3FilePath });
        })
        .on("error", (err) => {
          console.error("Error converting file:", err);
          res.status(500).send("Error converting file.");
        })
        .save(mp3FilePath);
    } catch (error) {
      next(error);
    }
  };
}
