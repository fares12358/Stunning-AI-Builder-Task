import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Apply saved theme before first paint to avoid flash
const savedTheme = localStorage.getItem('stunning-theme');
if (savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}
// Default (dark) requires no attribute — :root handles it

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
