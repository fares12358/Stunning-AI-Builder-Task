import client from './client.js';

/**
 * Start a brand-new conversation from the first prompt.
 *
 * @param {string} prompt — user's build description
 * @param {string[]} integrations — selected integration names
 * @returns {Promise<{ chatId, title, integrations, messages, createdAt, updatedAt }>}
 */
export const sendMessage = async (prompt, integrations) => {
  const { data } = await client.post('/chat', { prompt, integrations });
  return data.data; // unwrap { success: true, data: { chatId, title, integrations, messages, createdAt, updatedAt } }
};

/**
 * Send a follow-up prompt inside an existing conversation.
 *
 * @param {string} chatId
 * @param {string} prompt
 * @returns {Promise<{ chatId, title, integrations, messages, createdAt, updatedAt }>}
 */
export const sendFollowUp = async (chatId, prompt) => {
  const { data } = await client.post(`/chats/${chatId}/messages`, { prompt });
  return data.data;
};

/**
 * List recent saved conversations (title, integrations, timestamps only — no messages)
 */
export const getChats = async () => {
  const { data } = await client.get('/chats');
  return data.data;
};

/**
 * Get a single saved conversation, including its full message history
 */
export const getChat = async (id) => {
  const { data } = await client.get(`/chats/${id}`);
  return data.data;
};

/**
 * Delete a saved conversation by id
 */
export const deleteChat = async (id) => {
  await client.delete(`/chats/${id}`);
};
