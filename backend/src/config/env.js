import 'dotenv/config';

const required = ['PORT', 'MONGO_URI', 'OPENROUTER_API_KEY', 'OPENROUTER_MODEL', 'CLIENT_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;
export const CLIENT_URL = process.env.CLIENT_URL;
export const NODE_ENV = process.env.NODE_ENV || 'development';
