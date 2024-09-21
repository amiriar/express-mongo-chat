import { uploadAudio, uploadFile } from '../../common/utils/multer';
import express from 'express';
import { MessagesController } from '../../module/controllers/messages.controller';

const router = express.Router();
const MessagesControllerHandler = new MessagesController()

router.post('/upload-voice', uploadAudio.single('voiceMessage'), MessagesControllerHandler.uploadVoice);
router.post('/upload-file', uploadFile.single('file'), MessagesControllerHandler.uploadFile);

export const MessagesRoutes =  router;
