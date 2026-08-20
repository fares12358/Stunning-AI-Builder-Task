import rateLimit from 'express-rate-limit';

/**
 * Throttles the two routes that call OpenRouter (new build + follow-up).
 *
 * The AI model is a free-tier OpenRouter model with a hard 200 request/day
 * quota shared by every visitor (see CLAUDE.md — AI Integration Rules). With
 * no auth in front of the app, a single misbehaving client (a retry loop, a
 * script hitting the endpoint directly) can burn through that shared quota
 * and take the whole product down with a 502 for everyone else. This limiter
 * caps each IP well below that shared budget so one client can't exhaust it.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 AI requests per IP per window
  standardHeaders: true, // expose RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please wait a few minutes and try again.',
  },
});
