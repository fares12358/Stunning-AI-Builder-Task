import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { CLIENT_URL } from './config/env.js';
import healthRouter from './modules/health/health.routes.js';
import { chatRouter, chatsRouter } from './modules/chat/chat.routes.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();
                
// Security & parsing
app.use(helmet());
// credentials:true is intentionally omitted — the app has no auth/session
// cookies (see CLAUDE.md — Scope Boundaries), so allowing credentialed
// cross-origin requests would only widen the attack surface for no benefit.
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/chat', chatRouter);       
app.use('/api/chats', chatsRouter);

// 404 + error handling (must be last)
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
