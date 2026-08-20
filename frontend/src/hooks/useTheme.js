import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stunning-theme';
const DARK = 'dark';
const LIGHT = 'light';

/**
 * useTheme — manages light/dark theme
 *
 * Default: dark
 * Stored in localStorage to persist across sessions
 * Applied via data-theme attribute on <html>
 *
 * Returns: [theme, toggleTheme]
 */
export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DARK;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === LIGHT) {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === DARK ? LIGHT : DARK));
  };

  return [theme, toggleTheme];
};
