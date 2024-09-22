import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import autoBind from "auto-bind";
import ffmpegStatic from "ffmpeg-static";
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

          if (!senderParsed || !roomParsed) {
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

  // uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     if (req?.body?.fileUploadPath && req?.body?.filename) {
  //       req.body.fileUrl = path
  //         .join(req.body.fileUploadPath, req.body.filename)
  //         .replace(/\\/g, "/");
  //     }
  //     const result = await this.#service.uploadFile(req.body);

  //     const messageToSend = {
  //       content: "",
  //       room: req.body.room,
  //       isSending: false,
  //       fileUrl: result,
  //       sender: { // i have sender id in req.body.sender
  //         // _id: sender?._id,
  //         // username: sender?.username,
  //         // profile: sender?.profile,
  //       },
  //       // recipient: recipient // i have recipient id in req.body.recipient
  //       //   ? {
  //       //       _id: recipient._id,
  //       //       username: recipient.username,
  //       //       profile: recipient.profile,
  //       //     }
  //       //   : null,
  //     };

  //     res.json(messageToSend);
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure the fileUrl is properly set
      if (req?.body?.fileUploadPath && req?.body?.filename) {
        req.body.fileUrl = path
          .join(req.body.fileUploadPath, req.body.filename)
          .replace(/\\/g, "/");
      }

      // Call the service to handle the file upload and get the result

      // Extracting sender, recipient, and room from the request body
      const { sender, recipient, room } = req.body;

      // Parse the sender, recipient, and room fields (if necessary)
      const senderParsed = sender ? JSON.parse(sender) : null;
      const recipientParsed = recipient ? JSON.parse(recipient) : null;
      const roomParsed = room ? room : null;

      // Ensure required fields are present
      if (!senderParsed || !roomParsed) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newData = {
        sender: senderParsed?._id,
        recipient: recipientParsed ? recipientParsed?._id : null,
        room: room,
        fileUrl: req.body.fileUrl,
      };

      // const result = await this.#service.uploadFile(newData);

      const messageToSend = {
        content: "",
        room: roomParsed,
        isSending: false,
        fileUrl: req.body.fileUrl,
        sender: {
          _id: senderParsed?._id,
          username: senderParsed?.username,
          profile: senderParsed?.profile,
        },
        recipient: recipientParsed
          ? {
              _id: recipientParsed._id,
              username: recipientParsed.username,
              profile: recipientParsed.profile,
            }
          : null,
      };

      res.json(messageToSend);
    } catch (error) {
      next(error);
    }
  };
}
