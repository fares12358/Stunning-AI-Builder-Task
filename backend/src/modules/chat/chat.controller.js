import { validateChatInput, validateFollowUpInput } from './chat.validation.js';
import {
  startConversation,
  continueConversation,
  listRecentChats,
  getChatById,
  deleteChatById,
} from './chat.service.js';
import { ApiError } from '../../utils/api-error.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { valid, errors } = validateChatInput(req.body);
    if (!valid) {
      throw new ApiError(400, errors[0]);
    }

    const { prompt, integrations } = req.body;
    const result = await startConversation({ prompt, integrations });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const sendFollowUp = async (req, res, next) => {
  try {
    const { valid, errors } = validateFollowUpInput(req.body);
    if (!valid) {
      throw new ApiError(400, errors[0]);
    }

    const { id } = req.params;
    const { prompt } = req.body;
    const result = await continueConversation({ chatId: id, prompt });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const listChats = async (req, res, next) => {
  try {
    const chats = await listRecentChats();

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (err) {
    next(err);
  }
};

export const getChat = async (req, res, next) => {
  try {
    const chat = await getChatById(req.params.id);

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteChat = async (req, res, next) => {
  try {
    await deleteChatById(req.params.id);

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (err) {
    next(err);
  }
};
