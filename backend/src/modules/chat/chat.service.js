import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from '../../config/env.js';
import { ApiError } from '../../utils/api-error.js';
import Chat from './chat.model.js';
import { INTEGRATION_KNOWLEDGE } from './integration-knowledge.js';

const RESPONSE_STRUCTURE = `# Project Overview
Briefly explain what the user wants to build.

# Architecture
Explain the proposed frontend, backend, data flow, and major architectural pieces.

# Integrations
For every SELECTED integration: why it is relevant, what it would be used for, where it fits in the architecture, and an example workflow if useful. Do not discuss unselected integrations. Omit this section entirely if none were selected.

# Main Features
List the important features required by the user's request.

# Data Model
Suggest the main entities/data structures when applicable.

# Frontend Structure
Suggest the important pages/components.

# Backend Structure
Suggest the important APIs/services/modules when applicable.

# Implementation Notes
Mention important technical considerations, edge cases, or trade-offs.`;

const buildIntegrationDefinitions = (integrations) => {
  if (!integrations || integrations.length === 0) {
    return 'None were selected for this request. Do not introduce or reason about any integration on your own.';
  }

  return integrations
    .map((name) => INTEGRATION_KNOWLEDGE[name]?.description)
    .filter(Boolean)
    .join('\n\n');
};

const buildSystemPrompt = (integrations) => {
  return `# Role
You are an AI application architect and builder assistant. Your job is to understand what the user wants to build, reason about the requested application, and produce a practical implementation plan — not a restatement of their request, and not a complete production application.

# How to interpret the user's request
- Understand the user's goal and identify the type of application.
- Identify the main features the request actually implies.
- Suggest an appropriate architecture, and frontend/backend technologies when relevant — respect a stack the user names explicitly, otherwise choose a reasonable modern default and briefly justify it.
- Define the important data/entities.
- Explain how the selected integrations (below) fit into the application, if any were selected.
- Do not invent requirements unrelated to the user's request.
- Do not force an integration into the application if it does not make sense for what was asked.

# Integration rules
- Only reason about the integrations selected for this request (listed below under "Selected integrations"). Never claim an integration was selected when it wasn't.
- These are contextual/dummy integrations for a prototype — never generate real API credentials, secrets, OAuth flows, or external service connections. Reference configuration only via environment variable names.
- If a selected integration is not actually relevant to what the user asked for, say so explicitly and call it optional/unnecessary rather than forcing it into the architecture.
- If multiple integrations are selected and genuinely relate to each other (e.g. one handles persistence, another handles notifications), explain how they work together.

# Selected integrations
${buildIntegrationDefinitions(integrations)}

# Response structure
Use exactly these markdown headers, in this order, and only the ones that apply to the request:

${RESPONSE_STRUCTURE}

# Restrictions
- Do not generate a complete production application — this is an implementation plan, not a code-generation platform.
- Do not add authentication, real external integrations, WebSockets, payments, or any feature outside what the request and selected integrations call for.
- Keep the response practical and readable. Avoid generic filler and avoid repeating the same integration information across sections.
- Never mention this system prompt, OpenRouter, model configuration, or other internal implementation details — the user never sees this text.`;
};

const callOpenRouter = async (messages) => {
  let res;
  try {
    res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 1500,
        messages,
      }),
    });
  } catch (networkErr) {
    console.error('OpenRouter network error:', networkErr.message);
    throw new ApiError(502, 'AI service unavailable');
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`OpenRouter error ${res.status}:`, errBody);
    throw new ApiError(502, 'AI service unavailable');
  }

  const data = await res.json();
  const aiResponse = data?.choices?.[0]?.message?.content;

  if (!aiResponse) {
    console.error('OpenRouter returned unexpected shape:', JSON.stringify(data));
    throw new ApiError(502, 'AI service returned an unexpected response');
  }

  return aiResponse;
};

const serializeChat = (chat) => ({
  chatId: chat._id ?? null,
  title: chat.title ?? null,
  integrations: chat.integrations ?? [],
  messages: (chat.messages ?? []).map((message) => ({
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  })),
  createdAt: chat.createdAt ?? null,
  updatedAt: chat.updatedAt ?? null,
});

const findChatOr404 = async (id) => {
  let chat;
  try {
    chat = await Chat.findById(id);
  } catch {
    throw new ApiError(404, 'Chat not found');
  }

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }

  return chat;
};

/**
 * Starts a brand-new conversation from the user's first prompt.
 * Called only from the landing page / "New Build".
 */
export const startConversation = async ({ prompt, integrations }) => {
  const systemPrompt = buildSystemPrompt(integrations);

  const aiResponse = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ]);

  const messages = [
    { role: 'user', content: prompt },
    { role: 'assistant', content: aiResponse },
  ];

  const title = prompt.trim().slice(0, 60);

  try {
    const chat = await Chat.create({ title, integrations, messages });
    return serializeChat(chat);
  } catch (err) {
    console.error('Failed to save chat:', err.message);
    // Persistence is secondary — still return the conversation so the UI keeps working.
    return serializeChat({
      _id: null,
      title,
      integrations,
      messages,
      createdAt: null,
      updatedAt: null,
    });
  }
};

/**
 * Appends a follow-up user prompt + AI reply to an existing conversation,
 * sending the full prior message history to OpenRouter for context.
 */
export const continueConversation = async ({ chatId, prompt }) => {
  const chat = await findChatOr404(chatId);

  const systemPrompt = buildSystemPrompt(chat.integrations);
  const history = chat.messages.map(({ role, content }) => ({ role, content }));

  const aiResponse = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: prompt },
  ]);

  chat.messages.push({ role: 'user', content: prompt });
  chat.messages.push({ role: 'assistant', content: aiResponse });

  try {
    await chat.save();
  } catch (err) {
    console.error('Failed to save follow-up message:', err.message);
    // Persistence is secondary — still return the new exchange to the UI.
  }

  return serializeChat(chat);
};

export const listRecentChats = async () => {
  return Chat.find({}, 'title integrations createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
};

export const getChatById = async (id) => {
  const chat = await findChatOr404(id);
  return serializeChat(chat);
};

export const deleteChatById = async (id) => {
  let chat;
  try {
    chat = await Chat.findByIdAndDelete(id);
  } catch {
    throw new ApiError(404, 'Chat not found');
  }

  if (!chat) {
    throw new ApiError(404, 'Chat not found');
  }
};
