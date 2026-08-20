import { Router } from 'express';
import {
  sendMessage,
  sendFollowUp,
  listChats,
  getChat,
  deleteChat,
} from './chat.controller.js';
import { aiRateLimiter } from '../../middleware/rate-limit.middleware.js';

const chatRouter = Router();
chatRouter.post('/', aiRateLimiter, sendMessage);

const chatsRouter = Router();
chatsRouter.get('/', listChats);
chatsRouter.get('/:id', getChat);
chatsRouter.post('/:id/messages', aiRateLimiter, sendFollowUp);
chatsRouter.delete('/:id', deleteChat);

export { chatRouter, chatsRouter };
