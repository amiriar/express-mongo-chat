import { Router } from 'express';
import { sendMessage, getMessages } from '../controllers/chat.controller';

const router = Router();

// Send a message
router.post('/send', sendMessage);

// Get chat history
router.get('/history', getMessages);

export const ChatRoutes = router;