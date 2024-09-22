import autoBind from "auto-bind";
import createHttpError from "http-errors";
import { deleteFileInPublic } from "../../common/utils/functions";
import ChatMessageModel from "../models/chatMessage.model";

class MessagesService {
  #model;

  constructor() {
    autoBind(this);
    this.#model = ChatMessageModel;
  }

  async uploadVoice(
    mp3FilePath: string,
    senderParsed: string,
    recipientParsed: string,
    roomParsed: string
  ) {
    const newMessage = new ChatMessageModel({
      sender: senderParsed,
      recipient: recipientParsed,
      content: "",
      room: roomParsed,
      timestamp: new Date(),
      status: "sent",
      voiceUrl: mp3FilePath,
    });

    await newMessage.save();
  }

  // async uploadFile(data: any) {
  //   const message = await this.#model.create(data);
  //   return { fileUrl: message.fileUrl }
  // }
}

export default new MessagesService();
