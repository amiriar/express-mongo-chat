import { uploadAudio } from '../../common/utils/multer';
import express from 'express';
import { MessagesController } from '../../module/controllers/messages.controller';

const router = express.Router();
const MessagesControllerHandler = new MessagesController()

router.post('/upload-voice', uploadAudio.single('voiceMessage'), MessagesControllerHandler.uploadVoice);

export const MessagesRoutes =  router;
