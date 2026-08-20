import axios from 'axios';

/**
 * Central Axios client
 * baseURL comes from VITE_API_URL env var — never hardcoded
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s — AI responses can take time
});

export default client;
